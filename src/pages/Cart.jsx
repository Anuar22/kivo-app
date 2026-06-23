import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { ordersApi, paymentsApi } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";

// Load Stripe.js once from CDN — no npm package needed
function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(window.Stripe); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload  = () => resolve(window.Stripe);
    s.onerror = () => reject(new Error("Could not load Stripe.js"));
    document.head.appendChild(s);
  });
}

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// ── Stripe card form ────────────────────────────────────────────────────────
function StripeCardForm({ amount, onSuccess, onCancel }) {
  const cardRef    = useRef(null);
  const elemRef    = useRef(null); // Stripe CardElement instance
  const stripeRef  = useRef(null);
  const [ready, setReady]   = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    let mounted = true;
    loadStripeJs().then(Stripe => {
      if (!mounted || !cardRef.current) return;
      const stripe   = Stripe(PUBLISHABLE_KEY);
      const elements = stripe.elements();
      const card     = elements.create("card", {
        style: {
          base: {
            fontSize: "15px",
            fontFamily: "'DM Sans', sans-serif",
            color: "#0f0f0f",
            "::placeholder": { color: "#b0a89f" },
          },
          invalid: { color: "#ef4444" },
        },
        hidePostalCode: true,
      });
      card.mount(cardRef.current);
      card.on("ready", () => { if (mounted) setReady(true); });
      card.on("change", e => { if (mounted) setError(e.error?.message || ""); });
      stripeRef.current = stripe;
      elemRef.current   = card;
    }).catch(e => setError(e.message));

    return () => {
      mounted = false;
      elemRef.current?.destroy();
    };
  }, []);

  const pay = async () => {
    if (!stripeRef.current || !elemRef.current) return;
    setPaying(true);
    setError("");
    try {
      const { clientSecret } = await paymentsApi.createStripeIntent(amount);
      const { error: stripeErr, paymentIntent } = await stripeRef.current.confirmCardPayment(
        clientSecret,
        { payment_method: { card: elemRef.current } }
      );
      if (stripeErr) { setError(stripeErr.message); setPaying(false); return; }
      if (paymentIntent.status === "succeeded") onSuccess(paymentIntent.id);
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div
        ref={cardRef}
        style={{
          border: "1.5px solid #e8e4df",
          borderRadius: 12,
          padding: "14px 14px",
          background: "#fafaf9",
          minHeight: 46,
          transition: "border-color 0.2s",
        }}
      />
      {!ready && !error && (
        <p style={{ fontSize: 12, color: "#b0a89f", marginTop: 6 }}>Loading card form…</p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={pay}
          disabled={paying || !ready}
          style={{
            flex: 1, background: paying ? "#b0a89f" : "#0f0f0f",
            border: "none", borderRadius: 12, padding: "13px",
            color: "white", fontWeight: 700, fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", cursor: paying ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {paying ? "Processing…" : `Pay $${Number(amount).toFixed(2)}`}
        </button>
        <button
          onClick={onCancel}
          disabled={paying}
          style={{
            background: "none", border: "1.5px solid #e8e4df", borderRadius: 12,
            padding: "13px 16px", fontSize: 13, color: "#7a7065",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      <p style={{ fontSize: 11, color: "#b0a89f", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
        🔒 Powered by Stripe · Your card details never touch our servers
      </p>
    </div>
  );
}

// ── Main Cart ───────────────────────────────────────────────────────────────
const PAY_METHODS = [
  {
    id: "card", label: "Card",
    detail: "Pay securely with Visa or Mastercard",
    render: () => (
      <div className="pm-card-icons">
        <span className="pm-mc" /><span className="pm-visa">VISA</span>
      </div>
    ),
  },
  { id: "cash",   label: "Cash on Delivery", detail: "Pay when your order arrives", emoji: "💵" },
  { id: "mobile", label: "Mobile Money",     detail: "M-Pesa, Tigo, Airtel & more",  emoji: "📱" },
];

export default function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName, vendorId } = useCart();
  const [address, setAddress]       = useState("");
  const [payMethod, setPayMethod]   = useState("cash");
  const [showCardForm, setShowCardForm] = useState(false);
  const [placed, setPlaced]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const deliveryFee = items.length > 0 ? 2.00 : 0;
  const taxes       = items.length > 0 ? Math.round(total * 0.05 * 100) / 100 : 0;
  const grandTotal  = total + deliveryFee + taxes;

  const stripeAvailable = !!PUBLISHABLE_KEY;

  useEffect(() => {
    if (payMethod !== "card") setShowCardForm(false);
  }, [payMethod]);

  const submitOrder = async (stripePaymentId = null) => {
    if (!delivery.address.trim()) { setError("Please set a delivery address."); return; }
    setError("");
    setLoading(true);
    try {
      await ordersApi.place({
        vendorId,
        address:        delivery.address,
        deliveryLat:    delivery.lat,
        deliveryLng:    delivery.lng,
        paymentMethod:  payMethod,
        stripePaymentId,
        items: items.map(i => ({ menuItemId: i.id, qty: i.qty })),
      });
      setPlaced(true);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!delivery.address.trim()) { setError("Please set a delivery address."); return; }

    // ── Stripe card ──────────────────────────────────────────────────────────
    if (payMethod === "card" && stripeAvailable) {
      setShowCardForm(true);
      return;
    }

    // ── Paystack mobile money ────────────────────────────────────────────────
    if (payMethod === "mobile") {
      setLoading(true);
      setError("");
      try {
        // First create the order so we have an order ref to attach to the payment
        const { order } = await ordersApi.place({
          vendorId,
          address:       delivery.address,
          deliveryLat:   delivery.lat,
          deliveryLng:   delivery.lng,
          paymentMethod: "mobile",
          items: items.map(i => ({ menuItemId: i.id, qty: i.qty })),
        });

        // Initialize Paystack transaction — backend returns an authorization URL
        const { authorizationUrl } = await paymentsApi.paystackInit({
          amount:  grandTotal,
          orderId: order.id,
        });

        // Redirect to Paystack's hosted payment page
        // After payment, Paystack sends the user back to PAYSTACK_CALLBACK_URL
        clearCart();
        window.location.href = authorizationUrl;
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
      return;
    }

    submitOrder();
  };

  const closeSuccess = () => {
    clearCart();
    navigate("orders");
  };

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0 && !placed) return (
    <div className="page cart-page">
      <div className="empty-cart">
        <span className="empty-cart-icon">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Add some delicious food to get started</p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{ width: "auto", padding: "14px 32px" }}>
          Browse Restaurants
        </button>
      </div>
    </div>
  );

  return (
    <div className="cart-v2">
      <div style={{ padding: "0 20px 200px" }}>

        <div className="cart-vendor-label">
          <span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong>
        </div>

        {/* ── Items ── */}
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-emoji">{item.image}</div>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">${(item.price * item.qty).toFixed(2)}</p>
              </div>
              <div className="qty-control">
                <button onClick={() => removeItem(item.id)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => addItem(item, { id: vendorId, name: vendorName })}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Address ── */}
        <p className="cv2-section-title">📍 Delivery Address</p>
        <input
          className="pv2-input"
          placeholder="Enter your delivery address..."
          value={address}
          onChange={e => setAddress(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {/* ── Order summary ── */}
        <p className="cv2-section-title">Order summary</p>
        <div className="cv2-summary">
          <div className="cv2-summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="cv2-summary-row"><span>Taxes (5%)</span><span>${taxes.toFixed(2)}</span></div>
          <div className="cv2-summary-row"><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>
          <div className="cv2-summary-divider" />
          <div className="cv2-summary-row cv2-summary-total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>

        {/* ── Payment methods ── */}
        <p className="cv2-section-title">Payment methods</p>
        <div className="cv2-pay-list">
          {PAY_METHODS.map(pm => (
            <button
              key={pm.id}
              className={`cv2-pay-opt ${payMethod === pm.id ? "active" : ""} ${pm.disabled ? "disabled" : ""}`}
              onClick={() => { if (!pm.disabled) setPayMethod(pm.id); }}
              disabled={pm.disabled}
            >
              <div className="cv2-pay-icon">
                {pm.render ? pm.render() : pm.emoji}
              </div>
              <div className="cv2-pay-text">
                <span className="cv2-pay-label">{pm.label}{pm.id === "card" && !stripeAvailable ? " (setup required)" : ""}</span>
                <span className="cv2-pay-detail">{pm.detail}</span>
              </div>
              <div className={`cv2-radio ${payMethod === pm.id ? "checked" : ""}`} />
            </button>
          ))}
        </div>

        {/* Stripe card form */}
        {payMethod === "card" && stripeAvailable && showCardForm && (
          <div style={{ marginTop: 14, background: "#fafaf9", border: "1.5px solid #f0f0f0", borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#0f0f0f" }}>Enter card details</p>
            <StripeCardForm
              amount={grandTotal}
              onSuccess={(paymentId) => submitOrder(paymentId)}
              onCancel={() => setShowCardForm(false)}
            />
          </div>
        )}

        {payMethod === "card" && !stripeAvailable && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 10, fontSize: 12, color: "#7a7065", lineHeight: 1.6 }}>
            💡 Card payments need <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> configured. Cash on Delivery is available now.
          </div>
        )}

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#991b1b" }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Sticky bottom Pay bar ── */}
      {!showCardForm && (
        <div className="cv2-bottom-bar">
          <div className="cv2-bottom-total">
            <span className="cv2-bottom-total-label">Total amt</span>
            <span className="cv2-bottom-total-amount">${grandTotal.toFixed(2)}</span>
          </div>
          <button className="cv2-pay-btn" onClick={placeOrder} disabled={loading}>
            {loading ? "Placing…" : "Pay Now"}
          </button>
        </div>
      )}

      {placed && (
        <SuccessModal
          title="Success!"
          message={`Your order has been placed with ${vendorName}. You'll be notified once it's accepted.`}
          buttonLabel="Go Back"
          onClose={closeSuccess}
        />
      )}
    </div>
  );
}
