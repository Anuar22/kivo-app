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

// ── ClickPesa helpers ─────────────────────────────────────────────────────────
//
// Required env vars:
//   CLICKPESA_CLIENT_ID      → from ClickPesa dashboard → Applications
//   CLICKPESA_API_KEY        → from ClickPesa dashboard → Applications
//
// How it works:
//   1. POST /api/payments/clickpesa/push  → generate token + send USSD push to customer's phone
//   2. Customer receives USSD prompt → enters mobile money PIN
//   3. ClickPesa hits POST /api/payments/clickpesa/webhook → we mark order paid
//   4. GET  /api/payments/clickpesa/status?reference=xxx → frontend polls for result

const CLICKPESA_BASE = "https://api.clickpesa.com";

// Generate ClickPesa access token using Client ID + API Key
async function getClickPesaToken() {
  const clientId = process.env.CLICKPESA_CLIENT_ID;
  const apiKey   = process.env.CLICKPESA_API_KEY;
  if (!clientId || !apiKey) throw new Error("ClickPesa is not configured.");

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ client_id: clientId, api_key: apiKey });
    const options = {
      hostname: "api.clickpesa.com",
      path:     "/third-parties/generate-token",
      method:   "POST",
      headers:  { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    };
    const req = https.request(options, r => {
      let data = "";
      r.on("data", c => { data += c; });
      r.on("end",  () => {
        try {
          const json = JSON.parse(data);
          if (json.token) resolve(json.token);
          else reject(new Error(json.message || "Token generation failed."));
        } catch { reject(new Error("Invalid ClickPesa token response.")); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Build checksum: HMAC-SHA256 of "amount|currency|orderReference|phoneNumber" using API key
function buildChecksum(amount, currency, orderReference, phoneNumber) {
  const apiKey = process.env.CLICKPESA_API_KEY || "";
  const data   = `${amount}|${currency}|${orderReference}|${phoneNumber}`;
  return crypto.createHmac("sha256", apiKey).update(data).digest("hex");
}

function clickpesaRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.clickpesa.com",
      path,
      method,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, r => {
      let data = "";
      r.on("data", c => { data += c; });
      r.on("end",  () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Invalid response from ClickPesa.")); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// POST /api/payments/clickpesa/push
// Body: { orderId, amount, phoneNumber? }
// Uses req.user.phone as fallback if no phoneNumber provided
router.post("/clickpesa/push", auth, async (req, res) => {
  if (!process.env.CLICKPESA_CLIENT_ID || !process.env.CLICKPESA_API_KEY) {
    return res.status(503).json({ error: "Mobile money payments are not configured." });
  }

  const amount      = Number(req.body.amount);
  const phoneNumber = (req.body.phoneNumber || req.user.phone || "").replace(/\s+/g, "");
  const orderId     = req.body.orderId;

  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount." });
  if (!phoneNumber) return res.status(400).json({ error: "Phone number is required for mobile money." });
  if (!orderId)     return res.status(400).json({ error: "orderId is required." });

  // Normalise to Tanzanian format: +255XXXXXXXXX or 255XXXXXXXXX
  const phone = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber.startsWith("0") ? "255" + phoneNumber.slice(1) : phoneNumber;

  // Use order ref as orderReference (unique per transaction)
  const { rows } = await pool.query("SELECT ref FROM orders WHERE id=$1 AND customer_id=$2", [orderId, req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: "Order not found." });

  const orderReference = rows[0].ref;
  const currency       = "TZS";
  const amountStr      = String(Math.round(amount));
  const checksum       = buildChecksum(amountStr, currency, orderReference, phone);

  try {
    const token = await getClickPesaToken();

    const result = await clickpesaRequest(
      "POST",
      "/third-parties/payments/initiate-ussd-push-request",
      { amount: amountStr, currency, orderReference, phoneNumber: phone, checksum },
      token
    );

    if (!result.id) {
      console.error("ClickPesa push error:", result);
      return res.status(400).json({ error: result.message || "USSD push failed. Check the phone number and try again." });
    }

    // Store clickpesa payment id on the order for webhook matching
    await pool.query("UPDATE orders SET clickpesa_payment_id=$1 WHERE id=$2", [result.id, orderId]);

    res.json({
      paymentId:      result.id,
      status:         result.status,   // "PROCESSING"
      orderReference: result.orderReference,
      message:        `A payment request has been sent to ${phoneNumber}. Enter your mobile money PIN to complete the payment.`,
    });
  } catch (err) {
    console.error("ClickPesa push error:", err.message);
    res.status(500).json({ error: err.message || "Mobile money payment failed. Try again." });
  }
});

// GET /api/payments/clickpesa/status?reference=ORDER_REF
// Frontend polls this after push to check if customer paid
router.get("/clickpesa/status", auth, async (req, res) => {
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: "reference is required." });

  if (!process.env.CLICKPESA_CLIENT_ID || !process.env.CLICKPESA_API_KEY) {
    return res.status(503).json({ error: "ClickPesa not configured." });
  }

  try {
    const token  = await getClickPesaToken();
    const result = await clickpesaRequest("GET", `/third-parties/payments/query-payment-status?orderReference=${encodeURIComponent(reference)}`, null, token);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/clickpesa/webhook
// ClickPesa calls this when payment is confirmed
// Add this URL in ClickPesa dashboard → Webhooks: https://kivo-backend-9h1x.onrender.com/api/payments/clickpesa/webhook
router.post("/clickpesa/webhook", async (req, res) => {
  try {
    const { orderReference, status, collectedAmount } = req.body;
    console.log("[ClickPesa webhook]", req.body);

    if (status === "SUCCESSFUL" && orderReference) {
      // Find order by ref and mark payment confirmed
      await pool.query(
        "UPDATE orders SET payment_status='paid', payment_confirmed_at=NOW() WHERE ref=$1",
        [orderReference]
      );
      console.log(`[ClickPesa] Order ${orderReference} marked as paid. Amount: ${collectedAmount}`);
    }

    // Always respond 200 to ClickPesa so they don't retry
    res.json({ received: true });
  } catch (err) {
    console.error("[ClickPesa webhook error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
