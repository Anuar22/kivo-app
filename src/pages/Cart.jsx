import { useState } from "react";
import { API_BASE } from "../data/index.js";
import { useCart } from "../context/useCart.js";

export default function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName } = useCart();
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = items.length > 0 ? 2.00 : 0;
  const grandTotal = total + deliveryFee;

  const placeOrder = async () => {
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("kivo_token");
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vendorName,
          address,
          paymentMethod: payMethod,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
          total: grandTotal,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not place order.");
      }

      setPlaced(true);
      setTimeout(() => { clearCart(); navigate("orders"); }, 2600);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  const paymentOptions = [
    { id: "cash", label: "Cash on Delivery", icon: "💵" },
    { id: "mobile", label: "Mobile Money", icon: "📱", disabled: true },
    { id: "card", label: "Card Payment", icon: "💳", disabled: true },
  ];

  return (
    <div className="page cart-page">
      <div className="cart-vendor-label">
        <span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong>
      </div>

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
              <button onClick={() => addItem(item, { id: item.vendorId || null, name: vendorName })}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-section">
        <h3>📍 Delivery Address</h3>
        <input
          className="address-input"
          placeholder="Enter your delivery address..."
          value={address}
          onChange={e => { setAddress(e.target.value); setError(""); }}
        />
        {error && <div className="cart-error">{error}</div>}
      </div>

      <div className="cart-section">
        <h3>💳 Payment Method</h3>
        <div className="payment-options">
          {paymentOptions.map(opt => (
            <button
              key={opt.id}
              className={`payment-opt ${payMethod === opt.id ? "active" : ""} ${opt.disabled ? "disabled" : ""}`}
              onClick={() => !opt.disabled && setPayMethod(opt.id)}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {opt.disabled && <span className="coming-soon">Coming Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
        <div className="summary-row"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
        <div className="summary-row total-row"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
      </div>

      <button className="btn-primary place-order-btn" onClick={placeOrder} disabled={submitting}>
        {submitting ? "Placing order..." : `Place Order · $${grandTotal.toFixed(2)}`}
      </button>
      <div style={{ height: 20 }} />
    </div>
  );
}
