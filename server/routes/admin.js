const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { auth, requireRole } = require("../middleware/auth");

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function safeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    emailVerified: row.email_verified,
  };
}

// ─── INVITE-ONLY ADMIN REGISTRATION ───────────────────────────────────────────
//
// There is no public "become an admin" button anywhere in the app. The only
// way to create an admin account via the API is to know the secret value in
// ADMIN_SETUP_TOKEN (set in server/.env, never committed, never shown in any
// UI). The simpler path is server/scripts/seed-admin.js, which writes
// directly to the database and doesn't need this route at all.
//
// POST /api/admin/register
// body: { setupToken, name, email, password }
router.post("/register", async (req, res) => {
  try {
    const { setupToken, name, email, password } = req.body;

    if (!process.env.ADMIN_SETUP_TOKEN) {
      return res.status(503).json({ error: "Admin registration is not configured on this server." });
    }
    if (!setupToken || setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      return res.status(403).json({ error: "Invalid setup token." });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Admin passwords must be at least 8 characters." });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, email_verified)
       VALUES ($1,$2,$3,'admin',TRUE) RETURNING *`,
      [name, email, hash]
    );

    const user = rows[0];
    res.status(201).json({ user: safeUser(user), token: makeToken(user) });
  } catch (err) {
    console.error("Admin register error:", err.message);
    res.status(500).json({ error: "Could not create admin account." });
  }
});

// ─── EVERYTHING BELOW REQUIRES AN AUTHENTICATED ADMIN ────────────────────────

// GET /api/admin/users — list all users, optionally filtered by role
router.get("/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const { role, search } = req.query;
    const params = [];
    let sql = "SELECT id, name, email, phone, role, email_verified, is_banned, created_at FROM users WHERE 1=1";

    if (role && ["customer", "vendor", "admin"].includes(role)) {
      params.push(role);
      sql += ` AND role = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    sql += " ORDER BY created_at DESC LIMIT 200";

    const { rows } = await pool.query(sql, params);
    res.json({ users: rows });
  } catch (err) {
    console.error("Admin list users error:", err.message);
    res.status(500).json({ error: "Could not load users." });
  }
});

// PATCH /api/admin/users/:id/ban — ban or unban a user (blocks login)
router.patch("/users/:id/ban", auth, requireRole("admin"), async (req, res) => {
  try {
    const { banned } = req.body;
    if (typeof banned !== "boolean") return res.status(400).json({ error: "banned must be true or false." });

    const { rows } = await pool.query(
      "UPDATE users SET is_banned=$1 WHERE id=$2 RETURNING id, name, email, role, is_banned",
      [banned, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found." });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Admin ban user error:", err.message);
    res.status(500).json({ error: "Could not update user." });
  }
});

// GET /api/admin/vendors — list all vendors with approval status
router.get("/vendors", auth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.query; // 'pending' | 'approved' | 'all'
    let sql = `
      SELECT v.*, u.email, u.is_banned, u.created_at as user_created_at
      FROM vendors v JOIN users u ON u.id = v.user_id
      WHERE 1=1
    `;
    if (status === "pending")  sql += " AND v.is_approved = FALSE";
    if (status === "approved") sql += " AND v.is_approved = TRUE";
    sql += " ORDER BY v.created_at DESC LIMIT 200";

    const { rows } = await pool.query(sql);
    res.json({ vendors: rows });
  } catch (err) {
    console.error("Admin list vendors error:", err.message);
    res.status(500).json({ error: "Could not load vendors." });
  }
});

// PATCH /api/admin/vendors/:id/approve — approve or reject a pending vendor
router.patch("/vendors/:id/approve", auth, requireRole("admin"), async (req, res) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== "boolean") return res.status(400).json({ error: "approved must be true or false." });

    const { rows } = await pool.query(
      "UPDATE vendors SET is_approved=$1 WHERE id=$2 RETURNING *",
      [approved, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Vendor not found." });
    res.json({ vendor: rows[0] });
  } catch (err) {
    console.error("Admin approve vendor error:", err.message);
    res.status(500).json({ error: "Could not update vendor." });
  }
});

// DELETE /api/admin/users/:id — permanently delete a user account, including
// any order history tied to it. This is a deliberate hard delete for admin
// control before launch — it does NOT preserve orders for bookkeeping.
router.delete("/users/:id", auth, requireRole("admin"), async (req, res) => {
  const client = await pool.connect();
  try {
    if (String(req.params.id) === String(req.user.id)) {
      client.release();
      return res.status(400).json({ error: "You can't delete your own admin account." });
    }

    await client.query("BEGIN");

    const { rows: target } = await client.query(
      "SELECT id, role FROM users WHERE id=$1 FOR UPDATE",
      [req.params.id]
    );
    if (!target[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }
    if (target[0].role === "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Admin accounts can't be deleted from here." });
    }

    if (target[0].role === "vendor") {
      // orders.vendor_id has no cascade — clear out this vendor's orders
      // (and their order_items, which DO cascade off orders) before the
      // user delete cascades vendor → menu_items → reviews.
      const { rows: vRows } = await client.query("SELECT id FROM vendors WHERE user_id=$1", [req.params.id]);
      if (vRows[0]) {
        await client.query("DELETE FROM orders WHERE vendor_id=$1", [vRows[0].id]);
      }
    } else {
      // orders.customer_id has no cascade — clear out this customer's
      // orders the same way before deleting the user.
      await client.query("DELETE FROM orders WHERE customer_id=$1", [req.params.id]);
    }

    await client.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Admin delete user error:", err.message);
    res.status(500).json({ error: "Could not delete user." });
  } finally {
    client.release();
  }
});

// GET /api/admin/stats — quick platform overview
router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
        (SELECT COUNT(*) FROM users WHERE role='vendor')   AS vendors,
        (SELECT COUNT(*) FROM vendors WHERE is_approved=FALSE) AS pending_vendors,
        (SELECT COUNT(*) FROM users WHERE is_banned=TRUE)  AS banned_users,
        (SELECT COUNT(*) FROM orders)                       AS total_orders,
        (SELECT COALESCE(SUM(total),0) FROM orders WHERE status='Delivered') AS total_revenue
    `);
    const r = rows[0];
    res.json({
      customers: Number(r.customers),
      vendors: Number(r.vendors),
      pendingVendors: Number(r.pending_vendors),
      bannedUsers: Number(r.banned_users),
      totalOrders: Number(r.total_orders),
      totalRevenue: Number(r.total_revenue),
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ error: "Could not load stats." });
  }
});

module.exports = router;
