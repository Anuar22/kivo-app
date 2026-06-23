const router  = require("express").Router();
const https   = require("https");
const { auth } = require("../middleware/auth");

// ── Stripe ────────────────────────────────────────────────────────────────────
// POST /api/payments/stripe/intent
router.post("/stripe/intent", auth, async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: "Card payments are not configured on this server." });

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }

  try {
    const Stripe = require("stripe");
    const stripe = Stripe(stripeKey);
    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100),
      currency: process.env.STRIPE_CURRENCY || "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { customer_id: String(req.user.id) },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not create payment. Please try again." });
  }
});

// ── Paystack ──────────────────────────────────────────────────────────────────
// Paystack works via a simple redirect / hosted page flow:
// 1. POST /api/payments/paystack/init  → get an authorization_url from Paystack
// 2. Frontend redirects the user to that URL to pay on Paystack's hosted page
// 3. Paystack redirects back to PAYSTACK_CALLBACK_URL with ?reference=xxx
// 4. GET /api/payments/paystack/verify?reference=xxx  → confirm payment server-side
//
// Required env vars:
//   PAYSTACK_SECRET_KEY   → your Paystack secret key (sk_live_... or sk_test_...)
//   PAYSTACK_CURRENCY     → e.g. "NGN", "GHS", "KES", "TZS" (default: NGN)
//   PAYSTACK_CALLBACK_URL → full URL Paystack sends the user back to after payment
//                           e.g. https://kivo-app.vercel.app/paystack-callback

function paystackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) return reject(new Error("Paystack is not configured."));

    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.paystack.co",
      path,
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (r) => {
      let data = "";
      r.on("data", chunk => { data += chunk; });
      r.on("end",  ()    => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Invalid response from Paystack")); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// POST /api/payments/paystack/init
// Body: { amount, email, orderId?, metadata? }
// Returns: { authorizationUrl, reference }
router.post("/paystack/init", auth, async (req, res) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ error: "Mobile money payments are not configured." });
  }

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }

  const email    = req.body.email || req.user.email;
  const currency = process.env.PAYSTACK_CURRENCY || "NGN";

  // Paystack amounts are in the smallest currency unit (kobo for NGN, pesewas for GHS,
  // cents for KES/TZS/USD). Multiply by 100.
  const amountMinor = Math.round(amount * 100);

  try {
    const data = await paystackRequest("POST", "/transaction/initialize", {
      email,
      amount:   amountMinor,
      currency,
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        customer_id: req.user.id,
        order_id:    req.body.orderId || null,
        ...req.body.metadata,
      },
      channels: ["mobile_money", "card", "bank_transfer", "ussd"],
    });

    if (!data.status) {
      return res.status(400).json({ error: data.message || "Paystack initialization failed." });
    }

    res.json({
      authorizationUrl: data.data.authorization_url,
      reference:        data.data.reference,
      accessCode:       data.data.access_code,
    });
  } catch (err) {
    console.error("Paystack init error:", err.message);
    res.status(500).json({ error: "Could not initialize payment. Please try again." });
  }
});

// GET /api/payments/paystack/verify?reference=xxx
// Call this after Paystack redirects back with the reference.
// Returns: { verified: true, amount, reference, status } or error
router.get("/paystack/verify", auth, async (req, res) => {
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: "reference is required." });

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ error: "Paystack is not configured." });
  }

  try {
    const data = await paystackRequest("GET", `/transaction/verify/${encodeURIComponent(reference)}`);

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({
        verified: false,
        error: data.message || "Payment was not successful.",
        paystackStatus: data.data?.status,
      });
    }

    res.json({
      verified:  true,
      reference: data.data.reference,
      amount:    data.data.amount / 100, // back to major units
      currency:  data.data.currency,
      status:    data.data.status,
      channel:   data.data.channel,    // "mobile_money", "card", etc.
      paidAt:    data.data.paid_at,
    });
  } catch (err) {
    console.error("Paystack verify error:", err.message);
    res.status(500).json({ error: "Could not verify payment. Please try again." });
  }
});

module.exports = router;