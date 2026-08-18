const webpush = require("web-push");
const { pool } = require("./db");

const configured = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("⚠️  VAPID keys not set — push notifications are disabled.");
}

/**
 * Sends a push notification to every device a user has subscribed on.
 * Silently cleans up subscriptions that are gone (uninstalled, expired, etc).
 *
 * @param {number} userId
 * @param {{ title: string, body: string, url?: string }} payload
 */
async function sendPush(userId, payload) {
  if (!configured) return;

  const { rows } = await pool.query(
    "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=$1",
    [userId]
  );
  if (!rows.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
  });

  await Promise.all(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        // 404/410 = subscription is no longer valid on the browser's end — remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query("DELETE FROM push_subscriptions WHERE id=$1", [sub.id]).catch(() => {});
        } else {
          console.error("Push send error:", err.message);
        }
      }
    })
  );
}

module.exports = { sendPush, configured };