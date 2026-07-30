const router  = require("express").Router();
const https   = require("https");
const crypto  = require("crypto");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");

// ── Stripe ────────────────────────────────────────────────────────────────────
router.post("/stripe/intent", auth, async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: "Card payments are not configured." });
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount." });
  try {
    const stripe = require("stripe")(stripeKey);
    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100),
      currency: process.env.STRIPE_CURRENCY || "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { customer_id: String(req.user.id) },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not create payment. Try again." });
  }
});

// ── Snippe (mobile money) helpers ───────────────────────────────────────────────
//
// Required env vars:
//   SNIPPE_API_KEY        → from Snippe dashboard → Settings → API Keys
//   SNIPPE_WEBHOOK_SECRET → from Snippe dashboard → Settings → Webhook Secret
//
// How it works:
//   1. POST /api/payments/snippe/push  → create payment intent, send USSD push to customer's phone
//   2. Customer receives USSD prompt → enters mobile money PIN
//   3. Snippe hits POST /api/payments/snippe/webhook → we verify signature, mark order paid
//   4. GET  /api/payments/snippe/status?reference=xxx → frontend polls for result
//      (reference here is SNIPPE's own payment reference, returned by the push call —
//      not your internal order ref)

const SNIPPE_BASE = "api.snippe.sh";

function snippeRequest(method, path, body, idempotencyKey) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.SNIPPE_API_KEY;
    if (!apiKey) return reject(new Error("Snippe is not configured."));

    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SNIPPE_BASE,
      path,
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, r => {
      let data = "";
      r.on("data", c => { data += c; });
      r.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Invalid response from Snippe.")); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// POST /api/payments/snippe/push
// Body: { orderId, amount, phoneNumber? }
// Uses req.user.phone as fallback if no phoneNumber provided
router.post("/snippe/push", auth, async (req, res) => {
  if (!process.env.SNIPPE_API_KEY) {
    return res.status(503).json({ error: "Mobile money payments are not configured." });
  }

  const amount      = Number(req.body.amount);
  const phoneNumber = (req.body.phoneNumber || req.user.phone || "").replace(/\s+/g, "");
  const orderId     = req.body.orderId;

  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount." });
  if (!phoneNumber) return res.status(400).json({ error: "Phone number is required for mobile money." });
  if (!orderId)     return res.status(400).json({ error: "orderId is required." });

  // Normalise to Tanzanian format: 255XXXXXXXXX (no leading +)
  const phone = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber.startsWith("0") ? "255" + phoneNumber.slice(1) : phoneNumber;

  const { rows } = await pool.query(
    "SELECT ref, (SELECT name FROM users WHERE id=orders.customer_id) AS customer_name, (SELECT email FROM users WHERE id=orders.customer_id) AS customer_email FROM orders WHERE id=$1 AND customer_id=$2",
    [orderId, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Order not found." });

  const orderReference = rows[0].ref;
  const fullName  = (rows[0].customer_name || "Kivo Customer").trim();
  const firstname = fullName.split(" ")[0] || "Kivo";
  const lastname  = fullName.split(" ").slice(1).join(" ") || "Customer";
  const email     = rows[0].customer_email || "customer@kivo.app";

  // Idempotency key must be <= 30 chars — order refs (e.g. "KV-8568") are short, so this is safe
  const idempotencyKey = `order-${orderReference}`.slice(0, 30);

  try {
    const payload = {
      payment_type: "mobile",
      details: { amount: Math.round(amount), currency: "TZS" },
      phone_number: phone,
      customer: { firstname, lastname, email },
      metadata: { order_id: String(orderId), order_ref: orderReference },
    };
    if (process.env.BACKEND_URL) {
      payload.webhook_url = `${process.env.BACKEND_URL}/api/payments/snippe/webhook`;
    }

    const result = await snippeRequest("POST", "/v1/payments", payload, idempotencyKey);

    if (result.status !== "success" || !result.data?.reference) {
      console.error("Snippe push error:", result);
      return res.status(400).json({ error: result.message || "USSD push failed. Check the phone number and try again." });
    }

    // Store Snippe's payment reference on the order for webhook + status matching
    await pool.query("UPDATE orders SET snippe_reference=$1 WHERE id=$2", [result.data.reference, orderId]);

    res.json({
      paymentReference: result.data.reference,
      status:           result.data.status, // "pending"
      message:          `A payment request has been sent to ${phoneNumber}. Enter your mobile money PIN to complete the payment.`,
    });
  } catch (err) {
    console.error("Snippe push error:", err.message);
    res.status(500).json({ error: err.message || "Mobile money payment failed. Try again." });
  }
});

// GET /api/payments/snippe/status?reference=SNIPPE_PAYMENT_REFERENCE
// Frontend polls this after push to check if customer paid.
// NOTE: this is the reference Snippe returned from the push call, not your order ref.
router.get("/snippe/status", auth, async (req, res) => {
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: "reference is required." });

  if (!process.env.SNIPPE_API_KEY) {
    return res.status(503).json({ error: "Snippe not configured." });
  }

  try {
    const result = await snippeRequest("GET", `/v1/payments/${encodeURIComponent(reference)}`, null);
    if (result.status !== "success") return res.status(400).json({ error: result.message || "Could not fetch status." });
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/snippe/webhook
// Snippe calls this when payment completes/fails.
// Add this URL in Snippe dashboard → Webhooks: https://<your-backend-url>/api/payments/snippe/webhook
//
// IMPORTANT: signature verification requires the RAW request body. server.js must capture
// req.rawBody via the `verify` option on express.json() for this to work — see server.js.
router.post("/snippe/webhook", async (req, res) => {
  try {
    const signingKey = process.env.SNIPPE_WEBHOOK_SECRET;
    const timestamp  = req.headers["x-webhook-timestamp"];
    const signature  = req.headers["x-webhook-signature"];

    if (signingKey) {
      if (!timestamp || !signature) {
        console.warn("[Snippe webhook] missing signature headers, rejecting.");
        return res.status(400).json({ error: "Missing signature." });
      }

      // Reject stale webhooks (>5 min old) to prevent replay attacks
      const eventTime   = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (!Number.isFinite(eventTime) || currentTime - eventTime > 300) {
        console.warn("[Snippe webhook] timestamp too old, rejecting.");
        return res.status(400).json({ error: "Webhook timestamp too old." });
      }

      const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const message  = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac("sha256", signingKey).update(message).digest("hex");

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      const valid  = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

      if (!valid) {
        console.warn("[Snippe webhook] invalid signature, rejecting.");
        return res.status(400).json({ error: "Invalid signature." });
      }
    } else {
      console.warn("[Snippe webhook] SNIPPE_WEBHOOK_SECRET not set — accepting webhook WITHOUT signature verification. Set this env var before going live.");
    }

    const event = req.body;
    console.log("[Snippe webhook]", event.type, event.data?.reference);

    if (event.type === "payment.completed" && event.data?.reference) {
      await pool.query(
        "UPDATE orders SET payment_status='paid', payment_confirmed_at=NOW() WHERE snippe_reference=$1",
        [event.data.reference]
      );
      console.log(`[Snippe] Order with reference ${event.data.reference} marked as paid. Amount: ${event.data.amount?.value}`);
    } else if (event.type === "payment.failed" || event.type === "payment.voided" || event.type === "payment.expired") {
      await pool.query(
        "UPDATE orders SET payment_status='failed' WHERE snippe_reference=$1 AND payment_status='pending'",
        [event.data?.reference]
      );
    }

    // Always respond 2xx quickly so Snippe doesn't retry
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Snippe webhook error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;