const router = require("express").Router();
const { pool } = require("../db");
const { auth, requireRole } = require("../middleware/auth");

// GET /api/follows — vendors the current customer follows (full vendor rows)
router.get("/", auth, requireRole("customer"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT v.* FROM follows f
     JOIN vendors v ON v.id = f.vendor_id
     WHERE f.customer_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  res.json({ vendors: rows });
});

// GET /api/follows/ids — just the vendor ids, cheap for marking hearts on Home
router.get("/ids", auth, requireRole("customer"), async (req, res) => {
  const { rows } = await pool.query("SELECT vendor_id FROM follows WHERE customer_id=$1", [req.user.id]);
  res.json({ vendorIds: rows.map(r => r.vendor_id) });
});

// POST /api/follows/:vendorId — follow a vendor
router.post("/:vendorId", auth, requireRole("customer"), async (req, res) => {
  const { rows: vRows } = await pool.query("SELECT id FROM vendors WHERE id=$1", [req.params.vendorId]);
  if (!vRows[0]) return res.status(404).json({ error: "Vendor not found." });

  await pool.query(
    `INSERT INTO follows (customer_id, vendor_id) VALUES ($1,$2)
     ON CONFLICT (customer_id, vendor_id) DO NOTHING`,
    [req.user.id, req.params.vendorId]
  );
  res.json({ ok: true, following: true });
});

// DELETE /api/follows/:vendorId — unfollow a vendor
router.delete("/:vendorId", auth, requireRole("customer"), async (req, res) => {
  await pool.query("DELETE FROM follows WHERE customer_id=$1 AND vendor_id=$2", [req.user.id, req.params.vendorId]);
  res.json({ ok: true, following: false });
});

module.exports = router;
