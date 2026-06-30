import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import { vendorsApi, apiRequest } from "../api/index.js";
import { fmt } from "../utils/currency.js";

function StarRating({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ fontSize: size, cursor: onChange ? "pointer" : "default", opacity: n <= (hovered || value) ? 1 : 0.25, transition: "opacity 0.1s" }}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
        >⭐</span>
      ))}
    </div>
  );
}

function MenuItem({ item, vendor, addItem, getQty, removeItem }) {
  const qty = getQty(item.id);
  return (
    <div className="menu-item">
      <div className="menu-item-emoji">
        {item.image_url ? <img src={item.image_url} alt={item.name} className="menu-item-photo" /> : item.image}
      </div>
      <div className="menu-item-info">
        <div className="menu-item-top">
          <h4>{item.name}</h4>
          {item.popular && <span className="popular-badge">Popular</span>}
          {item.prep_time_minutes ? <span className="popular-badge" style={{ background: "var(--bg)", color: "var(--muted)" }}>⏱ {item.prep_time_minutes} min</span> : null}
        </div>
        <p>{item.description}</p>
        <div className="menu-item-bottom">
          <span className="menu-item-price">{fmt(item.price)}</span>
          {qty === 0 ? (
            <button className="add-btn" onClick={() => addItem(item, vendor)}>+ Add</button>
          ) : (
            <div className="qty-control">
              <button onClick={() => removeItem(item.id)}>−</button>
              <span>{qty}</span>
              <button onClick={() => addItem(item, vendor)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const date = new Date(review.created_at);
  const daysAgo = Math.floor((Date.now() - date) / 86400000);
  const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : daysAgo < 7 ? `${daysAgo} days ago` : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">{(review.customer_name || "A")[0].toUpperCase()}</div>
        <div>
          <p className="review-name">{review.customer_name || "Customer"}</p>
          <p className="review-time">{timeLabel}</p>
        </div>
        <span className="review-rating">{"⭐".repeat(review.rating)}</span>
      </div>
      {review.comment && <p className="review-text">{review.comment}</p>}
    </div>
  );
}

function ReviewForm({ orderId, onDone }) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!rating) { setError("Pick a star rating first."); return; }
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/orders/${orderId}/review`, { method: "POST", body: { rating, comment } });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 14, padding: 18, marginBottom: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#0f0f0f" }}>Leave a review</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Tell others about your experience (optional)"
        rows={3}
        style={{ width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e4df", fontSize: 14, fontFamily: "DM Sans, sans-serif", resize: "none", outline: "none", boxSizing: "border-box" }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</p>}
      <button onClick={submit} disabled={saving} style={{ marginTop: 10, background: "#e53935", border: "none", borderRadius: 10, padding: "10px 20px", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
        {saving ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

export default function VendorPage({ vendor, navigate }) {
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("menu");
  const [menuLoading, setMenuLoading] = useState(true);
  const [revLoading, setRevLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState(vendor.review_count || 0);
  const [deliveredOrderId, setDeliveredOrderId] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  const { addItem, getQty, removeItem } = useCart();

  useEffect(() => {
    setMenuLoading(true);
    vendorsApi.menu(vendor.id)
      .then(({ items }) => setMenu(items))
      .catch(console.error)
      .finally(() => setMenuLoading(false));

    vendorsApi.lastDeliveredOrder(vendor.id)
      .then(({ order_id, has_reviewed }) => {
        setDeliveredOrderId(order_id);
        setReviewed(has_reviewed);
      })
      .catch(() => {});
  }, [vendor.id]);

  const loadReviews = () => {
    setRevLoading(true);
    vendorsApi.reviews(vendor.id)
      .then(({ reviews: data, count }) => {
        setReviews(data);
        if (count !== undefined) setReviewCount(count);
      })
      .catch(console.error)
      .finally(() => setRevLoading(false));
  };

  useEffect(() => {
    if (tab === "reviews") loadReviews();
  }, [tab]);

  return (
    <div className="vendor-page">
      <div className="vendor-page-header" style={{ backgroundImage: vendor.cover_image_url ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${vendor.cover_image_url})` : "none" }}>
        <button className="back-btn" onClick={() => navigate("home")}>←</button>
        <div className="header-details">
          <h2>{vendor.name}</h2>
          <p>{vendor.category}</p>
        </div>
      </div>

      <div className="vendor-tabs">
        <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>Menu</button>
        <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Reviews ({reviewCount})</button>
      </div>

      {tab === "menu" && (
        <div className="menu-content">
          {menuLoading ? (
            <p>Loading menu...</p>
          ) : (
            <>
              <div className="menu-list">
                {menu.map(item => (
                  <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="reviews-score">{vendor.rating}</div>
            <div>
              <div className="reviews-stars">{"⭐".repeat(Math.round(Number(vendor.rating)))}</div>
              <p>{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
            </div>
          </div>

          {deliveredOrderId && !reviewed && (
            <ReviewForm orderId={deliveredOrderId} onDone={() => { setReviewed(true); loadReviews(); }} />
          )}

          {revLoading ? (
            <div className="empty-orders" style={{ padding: "32px 0" }}>
              <div className="emoji">⏳</div><p>Loading reviews…</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-orders" style={{ padding: "32px 0" }}>
              <div className="emoji">💬</div>
              <p>No reviews yet</p>
              <span>Be the first to leave one!</span>
            </div>
          ) : (
            reviews.map(r => <ReviewCard key={r.id} review={r} />)
          )}
        </div>
      )}
      <div style={{ height: 90 }} />
    </div>
  );
}