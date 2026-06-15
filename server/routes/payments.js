const router = require("express").Router();
const { auth } = require("../middleware/auth");

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
      amount: Math.round(amount * 100), // cents
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

module.exports = router;
