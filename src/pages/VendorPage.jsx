import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import { vendorsApi, apiRequest } from "../api/index.js";
import { fmt } from "../utils/currency.js";

// Clean inline SVG Icons to match system design
function NavIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (name === "back") {
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    );
  }
  
  if (name === "cart") {
    return (
      <svg {...common}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.2 11.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20 8H6" />
      </svg>
    );
  }
  return null;
}

function StarRating({ value, onChange, size = 22 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, margin: "4px 0" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ 
            fontSize: size, 
            cursor: onChange ? "pointer" : "default", 
            color: n <= (hovered || value) ? "#f59e0b" : "#222222",
            transition: "color 0.1s ease, transform 0.1s ease",
            transform: n <= hovered ? "scale(1.1)" : "scale(1)",
            display: "inline-flex",
            alignItems: "center"
          }}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </span>
      ))}
    </div>
  );
}

function MenuItem({ item, vendor, addItem, getQty, removeItem }) {
  const qty = getQty(item.id);
  return (
    <div className="menu-item" style={{ background: "#121212", borderRadius: "16px", padding: "16px", display: "flex", gap: "16px", marginBottom: "14px", border: "1px solid #222222", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div className="menu-item-emoji" style={{ width: "64px", height: "64px", borderRadius: "12px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", overflow: "hidden", border: "1px solid #262626", flexShrink: 0 }}>
        {item.image_url ? <img src={item.image_url} alt={item.name} className="menu-item-photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : item.image}
      </div>
      <div className="menu-item-info" style={{ flex: 1, minWidth: 0 }}>
        <div className="menu-item-top" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, color: "#ffffff", fontSize: "15px", fontWeight: "700" }}>{item.name}</h4>
          {item.popular && <span className="popular-badge" style={{ background: "rgba(229, 57, 53, 0.15)", color: "#e53935", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" }}>Popular</span>}
          {item.prep_time_minutes ? <span className="popular-badge" style={{ background: "#1a1a1a", color: "#a0a0a0", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", border: "1px solid #262626" }}>⏱ {item.prep_time_minutes} min</span> : null}
        </div>
        <p style={{ margin: "0 0 12px", color: "#a0a0a0", fontSize: "13px", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.description}</p>
        <div className="menu-item-bottom" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="menu-item-price" style={{ color: "#ffffff", fontWeight: "800", fontSize: "15px" }}>{fmt(item.price)}</span>
          {qty === 0 ? (
            <button className="add-btn" onClick={() => addItem(item, vendor)} style={{ background: "#e53935", color: "#ffffff", border: "none", borderRadius: "10px", padding: "6px 14px", fontWeight: "700", fontSize: "13px", cursor: "pointer", boxShadow: "0 2px 8px rgba(229,57,53,0.2)" }}>+ Add</button>
          ) : (
            <div className="qty-control" style={{ display: "flex", alignItems: "center", gap: "12px", background: "#000000", borderRadius: "10px", padding: "4px 10px", border: "1px solid #222" }}>
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "16px", fontWeight: "700", cursor: "pointer", padding: "0 4px" }}>−</button>
              <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px" }}>{qty}</span>
              <button onClick={() => addItem(item, vendor)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "16px", fontWeight: "700", cursor: "pointer", padding: "0 4px" }}>+</button>
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
    <div className="review-card" style={{ background: "#121212", borderRadius: "16px", padding: "16px", border: "1px solid #222222", marginBottom: "12px" }}>
      <div className="review-header" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <div className="review-avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(229, 57, 53, 0.12)", color: "#e53935", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", border: "1px solid rgba(229, 57, 53, 0.2)" }}>{(review.customer_name || "A")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="review-name" style={{ margin: 0, color: "#ffffff", fontWeight: "700", fontSize: "14px" }}>{review.customer_name || "Customer"}</p>
          <p className="review-time" style={{ margin: 0, color: "#666666", fontSize: "11px" }}>{timeLabel}</p>
        </div>
        <span className="review-rating" style={{ fontSize: "12px" }}>{"⭐".repeat(review.rating)}</span>
      </div>
      {review.comment && <p className="review-text" style={{ margin: 0, color: "#a0a0a0", fontSize: "13px", lineHeight: "1.5", paddingLeft: "48px" }}>{review.comment}</p>}
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
    <div style={{ background: "#121212", border: "1px solid #e53935", borderRadius: 14, padding: 18, marginBottom: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#ffffff" }}>Leave a review</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Tell others about your experience (optional)"
        rows={3}
        style={{ width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #222", background: "#000000", color: "#ffffff", fontSize: 14, fontFamily: "var(--font-body, 'DM Sans', sans-serif)", resize: "none", outline: "none", boxSizing: "border-box" }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6, margin: "6px 0 0" }}>{error}</p>}
      <button
        onClick={submit}
        disabled={saving}
        style={{ marginTop: 12, background: "#e53935", border: "none", borderRadius: 10, padding: "10px 20px", color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-body, 'DM Sans', sans-serif)" }}
      >
        {saving ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

export default function VendorPage({ vendor, deliveredOrderId, navigate }) {
  const { addItem, getQty, removeItem, count } = useCart();
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

  useEffect(() => {
    if (tab === "reviews") loadReviews();
  }, [tab, vendor?.id]);

  if (!vendor) return null;

  const popular      = menu.filter(i => i.popular || Number(i.order_count) >= 5);
  const tagColor     = vendor.tag_color ?? vendor.tagColor ?? "#e53935";
  const deliveryFee  = Number(vendor.delivery_fee ?? vendor.deliveryFee ?? 2);
  const deliveryTime = vendor.delivery_time ?? vendor.deliveryTime ?? "20–35 min";
  const reviewCount  = vendor.review_count ?? vendor.reviews ?? 0;

  return (
    <div className="page vendor-page" style={{ background: "#000000", minHeight: "100vh", color: "#ffffff", padding: "0 0 40px", marginTop: "calc(-1 * (var(--nav-h) + var(--sat)))", paddingTop: 0 }}>
      
      {/* ── Premium Sticky Navigation Header ── */}
      <div className="vendor-nav-header" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "12px 16px", 
        paddingTop: "calc(var(--sat) + 12px)",
        background: "#000000", 
        borderBottom: "1px solid #141414",
        position: "sticky",
        top: 0,
        zIndex: 100,
        marginTop: 0
      }}>
        <button 
          onClick={() => navigate ? navigate("home") : window.history.back()}
          style={{
            background: "#121212",
            border: "1px solid #222222",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            padding: 0,
            outline: "none"
          }}
          aria-label="Back"
        >
          <NavIcon name="back" />
        </button>
        
        <span style={{ 
          fontSize: "15px", 
          fontWeight: "700", 
          color: "#ffffff", 
          fontFamily: "var(--font-heading)" 
        }}>
          Restaurant
        </span>

        <button 
          onClick={() => navigate && navigate("cart")}
          style={{
            background: "#121212",
            border: "1px solid #222222",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            padding: 0,
            position: "relative",
            outline: "none"
          }}
          aria-label="Cart"
        >
          <NavIcon name="cart" />
          {count > 0 && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#e53935",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "800",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #000000"
            }}>
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Immersive Hero Header */}
      <div className="vendor-hero" style={{ position: "relative", height: "220px", background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "flex-end", padding: "24px 16px" }}>
        <div className="vendor-hero-art" style={{ position: "absolute", inset: 0, opacity: 0.15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "120px", pointerEvents: "none" }}>{vendor.image}</div>
        <div className="vendor-hero-overlay" style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <span className="vendor-hero-tag" style={{ background: tagColor, color: "#ffffff", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", display: "inline-block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{vendor.tag || "TOP RATED"}</span>
          <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "800", color: "#ffffff", fontFamily: "var(--font-heading)" }}>{vendor.name}</h2>
          <p style={{ margin: "0 0 14px", color: "#a0a0a0", fontSize: "13px", lineHeight: "1.4" }}>{vendor.description}</p>
          <div className="vendor-hero-meta" style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#ffffff", fontWeight: "600", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ color: "#f59e0b" }}>⭐</span> {vendor.rating} <span style={{ color: "#666666" }}>({reviewCount})</span></span>
            <span>⏱ {deliveryTime}</span>
            <span style={{ color: "#e53935" }}>🛵 {fmt(deliveryFee)} delivery</span>
          </div>
        </div>
      </div>

      {/* Segmented Controller Tabs */}
      <div className="vendor-tabs" style={{ display: "flex", background: "#121212", borderBottom: "1px solid #222", padding: "4px 16px", position: "sticky", top: "65px", zIndex: 10 }}>
        <div style={{ display: "flex", background: "#000000", border: "1px solid #222", padding: "3px", borderRadius: "12px", width: "100%", margin: "8px 0" }}>
          {["menu", "reviews"].map(t => (
            <button key={t} className={`vtab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "9px", fontWeight: "700", fontSize: "13px", cursor: "pointer", background: tab === t ? "#e53935" : "transparent", color: tab === t ? "#ffffff" : "#a0a0a0", transition: "0.2s", fontFamily: "var(--font-body, 'DM Sans', sans-serif)" }}>
              {t === "reviews" ? `Reviews${revTotal > 0 ? ` (${revTotal})` : ""}` : "Menu"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Context Switchers */}
      <div style={{ padding: "16px" }}>
        {tab === "menu" && (
          <div className="menu-content">
            {menuLoading ? (
              <div className="empty-state" style={{ textAlign: "center", padding: "40px 0", color: "#a0a0a0" }}><p>Loading menu...</p></div>
            ) : (
              <>
                {popular.length > 0 && (
                  <div className="menu-section" style={{ marginBottom: "24px" }}>
                    <h3 className="menu-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "800", color: "#ffffff", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "6px" }}>⭐ Popular Items</h3>
                    {popular.map(item => (
                      <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
                    ))}
                  </div>
                )}
                <div className="menu-section">
                  <h3 className="menu-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "800", color: "#ffffff", margin: "0 0 14px" }}>📋 Full Menu</h3>
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
            <div className="reviews-summary" style={{ display: "flex", alignItems: "center", gap: "16px", background: "#121212", padding: "16px", borderRadius: "16px", border: "1px solid #1a1a1a", marginBottom: "20px" }}>
              <div className="reviews-score" style={{ fontSize: "36px", fontWeight: "900", color: "#ffffff" }}>{vendor.rating}</div>
              <div>
                <div className="reviews-stars" style={{ fontSize: "14px", marginBottom: "2px", color: "#f59e0b" }}>
                  {"★".repeat(Math.round(Number(vendor.rating)))}{"☆".repeat(5 - Math.round(Number(vendor.rating)))}
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#a0a0a0", fontWeight: "600" }}>{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
              </div>
            </div>

            {deliveredOrderId && !reviewed && (
              <ReviewForm
                orderId={deliveredOrderId}
                onDone={() => { setReviewed(true); loadReviews(); }}
              />
            )}

            {revLoading ? (
              <div className="empty-orders" style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="emoji" style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                <p style={{ margin: 0, color: "#a0a0a0", fontSize: "14px" }}>Loading reviews…</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-orders" style={{ textAlign: "center", padding: "50px 20px" }}>
                <div className="emoji" style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                <p style={{ margin: "0 0 4px", color: "#ffffff", fontWeight: "700", fontSize: "15px" }}>No reviews yet</p>
                <span style={{ color: "#666666", fontSize: "13px" }}>Be the first to leave one!</span>
              </div>
            ) : (
              reviews.map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}
      </div>
      <div style={{ height: 90 }} />
    </div>
  );
}