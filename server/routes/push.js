const router = require("express").Router();
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const { configured } = require("../push");

// GET /api/push/vapid-public-key — public, the frontend needs this to subscribe
router.get("/vapid-public-key", (req, res) => {
  if (!configured) return res.status(503).json({ error: "Push notifications are not configured on this server." });
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — save (or refresh) a browser's push subscription for the logged-in user
router.post("/subscribe", auth, async (req, res) => {
  const { endpoint, keys } = req.body?.subscription || req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Invalid push subscription." });
  }

  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id`,
    [req.user.id, endpoint, keys.p256dh, keys.auth]
  );

  res.status(201).json({ ok: true });
});

// POST /api/push/unsubscribe — remove a subscription (e.g. on logout)
router.post("/unsubscribe", auth, async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "endpoint is required." });

  await pool.query(
    "DELETE FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2",
    [endpoint, req.user.id]
  );

  res.json({ ok: true });
});

module.exports = router;