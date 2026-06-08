const router = require("express").Router();
const { pool } = require("../db");
const { auth, requireRole } = require("../middleware/auth");

// ─── VENDOR SELF-MANAGEMENT (must come BEFORE /:id to avoid conflict) ─────────

// GET /api/vendors/me/profile
router.get("/me/profile", auth, requireRole("vendor"), async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Vendor profile not found." });
  res.json({ vendor: rows[0] });
});

// PATCH /api/vendors/me/profile
router.patch("/me/profile", auth, requireRole("vendor"), async (req, res) => {
  const { name, category, description, deliveryFee, deliveryTime, isOpen } = req.body;
  const { rows } = await pool.query(
    `UPDATE vendors SET
       name          = COALESCE($1, name),
       category      = COALESCE($2, category),
       description   = COALESCE($3, description),
       delivery_fee  = COALESCE($4, delivery_fee),
       delivery_time = COALESCE($5, delivery_time),
       is_open       = COALESCE($6, is_open)
     WHERE user_id=$7 RETURNING *`,
    [name, category, description, deliveryFee, deliveryTime, isOpen, req.user.id]
  );
  res.json({ vendor: rows[0] });
});

// GET /api/vendors/me/menu
router.get("/me/menu", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { rows } = await pool.query(
    "SELECT * FROM menu_items WHERE vendor_id=$1 ORDER BY available DESC, popular DESC, id",
    [vRows[0].id]
  );
  res.json({ menu: rows });
});

// POST /api/vendors/me/menu
router.post("/me/menu", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { name, description, price, image, popular, available } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price required." });
  const { rows } = await pool.query(
    `INSERT INTO menu_items (vendor_id, name, description, price, image, popular, available)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [vRows[0].id, name, description, price, image || "🍽️", !!popular, available !== false]
  );
  res.status(201).json({ item: rows[0] });
});

// PATCH /api/vendors/me/menu/:itemId
router.patch("/me/menu/:itemId", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { name, description, price, image, popular, available } = req.body;
  const { rows } = await pool.query(
    `UPDATE menu_items SET
       name        = COALESCE($1, name),
       description = COALESCE($2, description),
       price       = COALESCE($3, price),
       image       = COALESCE($4, image),
       popular     = COALESCE($5, popular),
       available   = COALESCE($6, available)
     WHERE id=$7 AND vendor_id=$8 RETURNING *`,
    [name, description, price, image, popular, available, req.params.itemId, vRows[0].id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Item not found." });
  res.json({ item: rows[0] });
});

// DELETE /api/vendors/me/menu/:itemId
router.delete("/me/menu/:itemId", auth, requireRole("vendor"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE user_id=$1", [req.user.id]);
  await pool.query("DELETE FROM menu_items WHERE id=$1 AND vendor_id=$2", [req.params.itemId, vRows[0]?.id]);
  res.json({ ok: true });
});

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/vendors
router.get("/", async (req, res) => {
  const { category } = req.query;
  let query = `
    SELECT v.*, u.email
    FROM vendors v JOIN users u ON u.id = v.user_id
    WHERE v.is_open = TRUE
  `;
  const params = [];
  if (category && category !== "All") {
    params.push(category);
    query += ` AND v.category = $${params.length}`;
  }
  query += " ORDER BY v.rating DESC";
  const { rows } = await pool.query(query, params);
  res.json({ vendors: rows });
});

// GET /api/vendors/:id
router.get("/:id", async (req, res) => {
  const { rows: vRows } = await pool.query(
    "SELECT v.*, u.email FROM vendors v JOIN users u ON u.id=v.user_id WHERE v.id=$1",
    [req.params.id]
  );
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });
  const { rows: menu } = await pool.query(
    "SELECT * FROM menu_items WHERE vendor_id=$1 AND available=TRUE ORDER BY popular DESC, id",
    [req.params.id]
  );
  res.json({ vendor: vRows[0], menu });
});

module.exports = router;
