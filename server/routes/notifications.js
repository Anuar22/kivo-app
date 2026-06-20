const router = require("express").Router();
const { pool } = require("../db");
const { auth } = require("../middleware/auth");

// GET /api/notifications — most recent first, capped at 50
router.get("/", auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, v.name AS vendor_name, v.image AS vendor_image
     FROM notifications n
     LEFT JOIN vendors v ON v.id = n.vendor_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [req.user.id]
  );
  const unreadCount = rows.filter(n => !n.read_at).length;
  res.json({ notifications: rows, unreadCount });
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", auth, async (req, res) => {
  await pool.query(
    "UPDATE notifications SET read_at = NOW() WHERE id=$1 AND user_id=$2 AND read_at IS NULL",
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// PATCH /api/notifications/read-all — mark everything read
router.patch("/read-all", auth, async (req, res) => {
  await pool.query(
    "UPDATE notifications SET read_at = NOW() WHERE user_id=$1 AND read_at IS NULL",
    [req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
