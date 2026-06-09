import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext.jsx";
import { ordersApi, paymentsApi } from "../api/index.js";

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
export default function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName, vendorId } = useCart();
  const [address, setAddress]       = useState("");
  const [payMethod, setPayMethod]   = useState("cash");
  const [showCardForm, setShowCardForm] = useState(false);
  const [placed, setPlaced]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const deliveryFee = items.length > 0 ? 2.00 : 0;
  const grandTotal  = total + deliveryFee;

  const stripeAvailable = !!PUBLISHABLE_KEY;

  const paymentOptions = [
    { id: "cash",   label: "Cash on Delivery", icon: "💵" },
    { id: "card",   label: "Card Payment",      icon: "💳", disabled: !stripeAvailable },
    { id: "mobile", label: "Mobile Money",      icon: "📱", disabled: true },
  ];

  // When user switches away from card, close the form
  useEffect(() => {
    if (payMethod !== "card") setShowCardForm(false);
  }, [payMethod]);

  const submitOrder = async (stripePaymentId = null) => {
    if (!address.trim()) { setError("Please enter a delivery address."); return; }
    setError("");
    setLoading(true);
    try {
      await ordersApi.place({
        vendorName,
        address,
        paymentMethod: payMethod,
        stripePaymentId,
        total: grandTotal,
        items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      });
      setPlaced(true);
      setTimeout(() => { clearCart(); navigate("orders"); }, 2600);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!address.trim()) { setError("Please enter a delivery address."); return; }
    if (payMethod === "card") {
      // Show the Stripe form — payment happens there, then calls submitOrder
      setShowCardForm(true);
      return;
    }
    submitOrder();
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (placed) return (
    <div className="page cart-page order-success">
      <div className="success-animation">
        <div className="success-circle">✓</div>
        <h2>Order Placed!</h2>
        <p>Your order has been sent to {vendorName}.<br />You'll be notified when accepted.</p>
        <div className="success-loader"><div className="success-bar" /></div>
      </div>
    </div>
  );

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) return (
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
    <div className="page cart-page">
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
      <div className="cart-section">
        <h3>📍 Delivery Address</h3>
        <input
          className="address-input"
          placeholder="Enter your delivery address..."
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      {/* ── Payment method ── */}
      <div className="cart-section">
        <h3>💳 Payment Method</h3>
        <div className="payment-options">
          {paymentOptions.map(opt => (
            <button
              key={opt.id}
              className={`payment-opt ${payMethod === opt.id ? "active" : ""} ${opt.disabled ? "disabled" : ""}`}
              onClick={() => {
                if (opt.disabled) return;
                setPayMethod(opt.id);
                setShowCardForm(false);
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {opt.disabled && (
                <span className="coming-soon">
                  {opt.id === "card" && !stripeAvailable ? "Setup Required" : "Coming Soon"}
                </span>
              )}
              {opt.id === "card" && stripeAvailable && payMethod === "card" && !showCardForm && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Ready</span>
              )}
            </button>
          ))}
        </div>

        {/* Stripe card form — shown inline when card is selected and Pay is clicked */}
        {payMethod === "card" && stripeAvailable && showCardForm && (
          <div style={{ marginTop: 12, background: "#fafaf9", border: "1.5px solid #e8e4df", borderRadius: 14, padding: "16px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#0f0f0f" }}>Enter card details</p>
            <StripeCardForm
              amount={grandTotal}
              onSuccess={(paymentId) => submitOrder(paymentId)}
              onCancel={() => setShowCardForm(false)}
            />
          </div>
        )}

        {/* No VITE_STRIPE_PUBLISHABLE_KEY set — guide message */}
        {payMethod === "card" && !stripeAvailable && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 10, fontSize: 12, color: "#7a7065", lineHeight: 1.6 }}>
            💡 Card payments need <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>.env</code> and <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>STRIPE_SECRET_KEY</code> in the server <code style={{ background: "#f0ede9", borderRadius: 4, padding: "1px 5px" }}>.env</code>.
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
        <div className="summary-row"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
        <div className="summary-row total-row"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#991b1b" }}>
          {error}
        </div>
      )}

      {/* Hide the main CTA when the Stripe form is open — it has its own Pay button */}
      {!showCardForm && (
        <button className="btn-primary place-order-btn" onClick={placeOrder} disabled={loading}>
          {loading
            ? "Placing order..."
            : payMethod === "card" && stripeAvailable
              ? `Pay by Card · $${grandTotal.toFixed(2)}`
              : `Place Order · $${grandTotal.toFixed(2)}`
          }
        </button>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}
