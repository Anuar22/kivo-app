import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import { vendorsApi, apiRequest } from "../api/index.js";
import { fmt } from "../utils/currency.js";

const vendorStyleTag = document.createElement("style");
vendorStyleTag.innerHTML = `
  .vendor-page-container { font-family: 'DM Sans', sans-serif; background: #f7f5f2; min-height: 100vh; padding-bottom: 90px; box-sizing: border-box; }
  .vendor-hero { position: relative; background: #2d221e; color: white; padding: 40px 20px 24px; display: flex; align-items: center; gap: 16px; border-radius: 0 0 24px 24px; }
  .vendor-hero-art { font-size: 52px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
  .vendor-hero-overlay h2 { margin: 4px 0; font-size: 22px; font-family: 'Georgia', serif; }
  .vendor-hero-overlay p { margin: 0 0 8px; font-size: 13px; opacity: 0.8; }
  .vendor-hero-tag { font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 6px; color: white; display: inline-block; }
  .vendor-hero-meta { display: flex; gap: 12px; font-size: 12px; opacity: 0.9; font-weight: 600; }
  .vendor-tabs { display: flex; border-bottom: 1px solid #e8e4df; background: white; }
  .vtab { flex: 1; text-align: center; padding: 14px; background: none; border: none; font-weight: 700; font-size: 14px; color: #7a7065; cursor: pointer; }
  .vtab.active { color: #e53935; border-bottom: 3px solid #e53935; }
  .menu-content, .reviews-content { padding: 16px; }
  .menu-section-title { font-size: 15px; font-weight: 800; margin: 18px 0 12px; color: #7a7065; text-transform: uppercase; letter-spacing: 0.5px; }
  .menu-item { background: white; border: 1px solid #e8e4df; border-radius: 16px; padding: 14px; display: flex; gap: 14px; margin-bottom: 12px; }
  .menu-item-emoji { width: 64px; height: 64px; background: #f7f5f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; overflow: hidden; }
  .menu-item-photo { width: 100%; height: 100%; object-fit: cover; }
  .menu-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
  .menu-item-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .menu-item-top h4 { margin: 0; font-size: 15px; font-weight: 800; color: #0f0f0f; }
  .popular-badge { background: #fff3e0; color: #e65100; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
  .menu-item-info p { margin: 4px 0 8px; font-size: 12px; color: #7a7065; line-height: 1.4; }
  .menu-item-bottom { display: flex; justify-content: space-between; align-items: center; }
  .menu-item-price { font-weight: 800; font-size: 14px; color: #0f0f0f; }
  .add-btn { background: white; border: 1.5px solid #e53935; color: #e53935; font-weight: 700; padding: 6px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; }
  .qty-control { display: flex; align-items: center; gap: 10px; background: #f7f5f2; padding: 4px 8px; border-radius: 10px; }
  .qty-control button { border: none; background: white; font-weight: 800; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; }
  .reviews-summary { background: white; border: 1px solid #e8e4df; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
  .reviews-score { font-size: 36px; font-weight: 800; font-family: 'Georgia', serif; color: #0f0f0f; }
  .review-card { background: white; border: 1px solid #e8e4df; border-radius: 14px; padding: 14px; margin-bottom: 12px; }
  .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .review-avatar { width: 32px; height: 32px; background: #ffe8da; color: #e53935; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .review-name { font-weight: 700; font-size: 13px; margin: 0; }
  .review-time { font-size: 11px; color: #7a7065; margin: 1px 0 0; }
  .review-text { font-size: 13px; margin: 0; color: #362f2d; line-height: 1.4; }
`;
document.head.appendChild(vendorStyleTag);

function StarRating({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: size, cursor: onChange ? "pointer" : "default", opacity: n <= (hovered || value) ? 1 : 0.25 }} onMouseEnter={() => onChange && setHovered(n)} onMouseLeave={() => onChange && setHovered(0)} onClick={() => onChange && onChange(n)}>⭐</span>
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
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">{(review.customer_name || "A")[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}><p className="review-name">{review.customer_name || "Customer"}</p></div>
        <span>{"⭐".repeat(review.rating)}</span>
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
    setSaving(true); setError("");
    try {
      await apiRequest(`/api/orders/${orderId}/review`, { method: "POST", body: { rating, comment } });
      onDone();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: "#fff8f5", border: "1.5px solid #ffe8da", borderRadius: 14, padding: 18, marginBottom: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 10px" }}>Leave a review</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell others about your experience..." rows={3} style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #e8e4df", boxSizing: "border-box" }} />
      {error && <p style={{ color: "#ef4444", fontSize: 12 }}>{error}</p>}
      <button onClick={submit} disabled={saving} style={{ marginTop: 10, background: "#e53935", border: "none", borderRadius: 10, padding: "10px 20px", color: "white", fontWeight: 700, cursor: "pointer" }}>
        {saving ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

export default function VendorPage({ vendor, deliveredOrderId }) {
  const { addItem, getQty, removeItem } = useCart();
  const [tab, setTab]           = useState("menu");
  const [menu, setMenu]         = useState(vendor?.menu || []);
  const [menuLoading, setMenuLoading] = useState(!vendor?.menu);
  const [reviews, setReviews]   = useState([]);
  const [revTotal, setRevTotal] = useState(0);
  const [revLoading, setRevLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    vendorsApi.get(vendor.id)
      .then(({ menu }) => setMenu(menu))
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, [vendor?.id]);

  const loadReviews = () => {
    if (!vendor) return;
    setRevLoading(true);
    apiRequest(`/api/vendors/${vendor.id}/reviews`)
      .then(({ reviews: list, total }) => { setReviews(list); setRevTotal(total); })
      .catch(() => {})
      .finally(() => setRevLoading(false));
  };

  useEffect(() => { if (tab === "reviews") loadReviews(); }, [tab]);

  if (!vendor) return null;
  const popular = menu.filter(i => i.popular || Number(i.order_count) >= 5);

  return (
    <div className="vendor-page-container">
      <div className="vendor-hero">
        <div className="vendor-hero-art">{vendor.image}</div>
        <div className="vendor-hero-overlay">
          <span className="vendor-hero-tag" style={{ background: vendor.tag_color || "#e53935" }}>{vendor.tag}</span>
          <h2>{vendor.name}</h2>
          <p>{vendor.description}</p>
          <div className="vendor-hero-meta"><span>⭐ {vendor.rating}</span><span>🛵 {fmt(vendor.delivery_fee ?? 2000)}</span></div>
        </div>
      </div>

      <div className="vendor-tabs">
        <button className={`vtab ${tab === "menu" ? "active" : ""}`} onClick={() => setTab("menu")}>Menu</button>
        <button className={`vtab ${tab === "reviews" ? "active" : ""}`} onClick={() => setTab("reviews")}>Reviews ({revTotal})</button>
      </div>

      {tab === "menu" && (
        <div className="menu-content">
          {menuLoading ? <p>Loading menu...</p> : (
            <>
              {popular.length > 0 && (
                <>
                  <div className="menu-section-title">⭐ Popular Items</div>
                  {popular.map(item => <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />)}
                </>
              )}
              <div className="menu-section-title">📋 Full Menu</div>
              {menu.map(item => <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />)}
            </>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="reviews-score">{vendor.rating}</div>
            <div><div>{"⭐".repeat(Math.round(Number(vendor.rating)))}</div></div>
          </div>
          {deliveredOrderId && !reviewed && <ReviewForm orderId={deliveredOrderId} onDone={() => { setReviewed(true); loadReviews(); }} />}
          {revLoading ? <p>Loading reviews…</p> : reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}