const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");

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
    businessName: row.business_name,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, phone, password, role = "customer", businessName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!["customer", "vendor"].includes(role)) {
    return res.status(400).json({ error: "Role must be customer or vendor." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, phone, password, role, business_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, email, phone || null, hash, role, businessName || null]
    );

    const user = rows[0];

    // Auto-create vendor profile
    if (role === "vendor") {
      await client.query(
        `INSERT INTO vendors (user_id, name, category, description)
         VALUES ($1,$2,$3,$4)`,
        [user.id, businessName || name, "Local Food", "Welcome to our restaurant!"]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ user: safeUser(user), token: makeToken(user) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({ user: safeUser(user), token: makeToken(user) });
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "User not found." });
  res.json({ user: safeUser(rows[0]) });
});

module.exports = router;

// PATCH /api/auth/me/update — update name / phone
router.patch("/me/update", auth, async (req, res) => {
  const { name, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET
       name  = COALESCE($1, name),
       phone = COALESCE($2, phone)
     WHERE id=$3 RETURNING *`,
    [name || null, phone || null, req.user.id]
  );
  res.json({ user: safeUser(rows[0]) });
});
