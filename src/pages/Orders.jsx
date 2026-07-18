import { useState, useEffect, useCallback } from "react";
import { ordersApi, subscribeOrderSSE, reviewsApi } from "../api/index.js";
import { STATUSES, STATUS_ICONS } from "../data/index.js";
import { fmt } from "../utils/currency.js";
import SuccessModal from "../components/SuccessModal.jsx";

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* Premium Dark-Theme Status Color Tokens */
const STATUS_STYLE = {
  Pending:   { bg: "rgba(255, 179, 0, 0.12)", color: "#ffb300" },
  Accepted:  { bg: "rgba(22, 163, 74, 0.12)",  color: "#16a34a" },
  Preparing: { bg: "rgba(249, 115, 22, 0.12)", color: "#f97316" },
  Ready:     { bg: "rgba(37, 99, 235, 0.12)",  color: "#2563eb" },
  Delivered: { bg: "rgba(22, 163, 74, 0.12)",  color: "#16a34a" },
  Cancelled: { bg: "rgba(239, 68, 68, 0.12)",  color: "#ef4444" },
};

// ── Inline star rating picker ─────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "22px", opacity: n <= value ? 1 : 0.25, lineHeight: 1 }}
        >⭐</button>
      ))}
    </div>
  );
}

// ── Review form shown inline on delivered orders ───────────────────────────
function ReviewBox({ orderId, onDone }) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!rating) { setError("Pick a star rating first."); return; }
    setSaving(true);
    setError("");
    try {
      await reviewsApi.submit(orderId, { rating, comment });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ov2-review-box" style={{ background: "#1a1a1a", borderRadius: "12px", border: "1px solid #222", padding: "14px", marginTop: "14px" }}>
      <p className="ov2-review-title" style={{ color: "#ffffff", fontSize: "13px", fontWeight: "700", margin: "0 0 8px" }}>Rate your order</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        className="pv2-input"
        rows={2}
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ marginTop: "10px", resize: "none", fontFamily: "DM Sans, sans-serif", width: "100%", background: "#000000", border: "1px solid #222", color: "#ffffff", padding: "10px", borderRadius: "8px", boxSizing: "border-box" }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", margin: 0 }}>{error}</p>}
      <button 
        className="ov2-review-submit" 
        onClick={submit} 
        disabled={saving}
        style={{ width: "100%", marginTop: "12px", background: "#e53935", color: "#ffffff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer" }}
      >
        {saving ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

// ── Status progress tracker ─────────────────────────────────────────────────
function StatusTracker({ status }) {
  const idx = STATUSES.indexOf(status);
  const steps = STATUSES.slice(0, -1); 
  return (
    <div className="ov2-tracker" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161616", padding: "14px", borderRadius: "10px", margin: "12px 14px 4px", border: "1px solid #222" }}>
      {steps.map((s, i) => (
        <div key={s} className="ov2-tracker-step" style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 }}>
          <div 
            className={`ov2-tracker-dot ${i <= idx ? "done" : ""} ${i === idx ? "current" : ""}`}
            style={{ 
              width: "28px", 
              height: "28px", 
              borderRadius: "50%", 
              background: i === idx ? "#e53935" : i < idx ? "rgba(22, 163, 74, 0.2)" : "#222", 
              border: i === idx ? "2px solid #e53935" : i < idx ? "1px solid #16a34a" : "1px solid #333",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "12px", 
              color: i <= idx ? "#ffffff" : "#666",
              zIndex: 2
            }}
          >
            {i < idx ? "✓" : STATUS_ICONS[s]}
          </div>
          <span 
            className={i <= idx ? "ov2-tracker-label done" : "ov2-tracker-label"}
            style={{ fontSize: "10px", color: i <= idx ? "#ffffff" : "#666", marginTop: "6px", fontWeight: i === idx ? "700" : "500", textAlign: "center" }}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <div 
              className={`ov2-tracker-line ${i < idx ? "done" : ""}`} 
              style={{ 
                position: "absolute", 
                top: "14px", 
                left: "50%", 
                width: "100%", 
                height: "2px", 
                background: i < idx ? "#16a34a" : "#222", 
                zIndex: 1 
              }} 
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onUpdate, reviewedIds, onReviewed }) {
  const isLive     = !["Delivered", "Cancelled"].includes(order.status);
  const isDelivered = order.status === "Delivered";
  const [expanded, setExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const style = STATUS_STYLE[order.status] || { bg: "#222", color: "#a0a0a0" };
  const alreadyReviewed = reviewedIds.has(order.id);

  useEffect(() => {
    if (!isLive) return;
    const unsub = subscribeOrderSSE(order.id, onUpdate);
    return unsub;
  }, [order.id, isLive]);

  return (
    <div className="ov2-card" style={{ background: "#121212", borderRadius: "16px", border: "1px solid #222", marginBottom: "14px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      {isLive && (
        <div className="ov2-live-badge" style={{ background: "rgba(229, 57, 53, 0.12)", color: "#e53935", padding: "6px 14px", fontSize: "11px", fontWeight: "700", borderBottom: "1px solid rgba(229, 57, 53, 0.15)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e53935", display: "inline-block", animation: "pulse 1.5s infinite" }} /> Live tracking
        </div>
      )}

      <div className="ov2-card-header" onClick={() => setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", cursor: "pointer" }}>
        <div className="ov2-card-emoji" style={{ fontSize: "28px", width: "42px", height: "42px", borderRadius: "10px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #222" }}>🍽️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="ov2-card-vendor" style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.vendor_name}</p>
          <p className="ov2-card-meta" style={{ color: "#a0a0a0", fontSize: "12px", margin: 0 }}>{order.ref} · {timeAgo(order.created_at)}</p>
        </div>
        <span className="ov2-status-pill" style={{ background: style.bg, color: style.color, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
          {order.status}
        </span>
      </div>

      {isLive && <StatusTracker status={order.status} />}

      {expanded && (
        <div className="ov2-items" style={{ background: "#0a0a0a", padding: "12px 16px", borderTop: "1px solid #222", borderBottom: "1px solid #222" }}>
          {order.items?.map((item, i) => (
            <div key={i} className="ov2-item-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#a0a0a0", padding: "4px 0" }}>
              <span><span className="ov2-item-qty" style={{ color: "#e53935", fontWeight: "700" }}>{item.qty}×</span> {item.name}</span>
              <span style={{ color: "#ffffff" }}>{fmt(Number(item.price) * item.qty)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ov2-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#161616", borderTop: "1px solid #222" }}>
        <button className="ov2-expand-btn" onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: "#a0a0a0", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
          {expanded ? "Hide items" : "View items"}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div className="ov2-total" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#a0a0a0" }}>
          <span>Total</span>
          <span className="ov2-total-amount" style={{ color: "#ffffff", fontWeight: "800", fontSize: "15px" }}>{fmt(order.total)}</span>
        </div>
      </div>

      {/* Review CTA for delivered orders */}
      <div style={{ padding: "0 16px 16px" }}>
        {isDelivered && !alreadyReviewed && (
          <ReviewBox orderId={order.id} onDone={() => { onReviewed(order.id); setShowSuccess(true); }} />
        )}
        {isDelivered && alreadyReviewed && (
          <p className="ov2-reviewed-note" style={{ color: "#16a34a", fontSize: "12px", fontWeight: "600", margin: "12px 0 0", textAlign: "center" }}>✓ You reviewed this order</p>
        )}
      </div>

      {showSuccess && (
        <SuccessModal
          title="Thanks!"
          message="Your review has been submitted and helps other customers."
          buttonLabel="Done"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [tab, setTab]         = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [reviewedIds, setReviewedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("kivo_reviewed") || "[]")); }
    catch { return new Set(); }
  });

  const load = useCallback(async () => {
    try {
      const { orders: list } = await ordersApi.myOrders();
      setOrders(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = useCallback((updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  const markReviewed = (id) => {
    setReviewedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("kivo_reviewed", JSON.stringify([...next]));
      return next;
    });
  };

  const active  = orders.filter(o => !["Delivered", "Cancelled"].includes(o.status));
  const history = orders.filter(o =>  ["Delivered", "Cancelled"].includes(o.status));
  const list    = tab === "active" ? active : history;

  return (
    <div 
      className="orders-v2" 
      style={{ 
        background: "#000000", 
        minHeight: "100vh", 
        color: "#ffffff", 
        padding: "20px 16px 100px" /* Changed from 16px to 20px for the top padding */
      }}
    >
      <div className="ov2-header" style={{ marginBottom: "20px" }}>
        <p className="ov2-title" style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "800", color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.4px" }}>My Orders</p>
        
        {/* Sleek Dark Segmented Tabs */}
        <div className="ov2-tabs" style={{ display: "flex", background: "#121212", border: "1px solid #222", padding: "4px", borderRadius: "12px" }}>
          <button 
            className={`ov2-tab ${tab === "active" ? "active" : ""}`} 
            onClick={() => setTab("active")}
            style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "9px", fontWeight: "600", fontSize: "13px", cursor: "pointer", background: tab === "active" ? "#e53935" : "transparent", color: tab === "active" ? "#ffffff" : "#a0a0a0", transition: "0.2s" }}
          >
            Active{active.length > 0 ? ` (${active.length})` : ""}
          </button>
          <button 
            className={`ov2-tab ${tab === "history" ? "active" : ""}`} 
            onClick={() => setTab("history")}
            style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: "9px", fontWeight: "600", fontSize: "13px", cursor: "pointer", background: tab === "history" ? "#e53935" : "transparent", color: tab === "history" ? "#ffffff" : "#a0a0a0", transition: "0.2s" }}
          >
            History
          </button>
        </div>
      </div>

      <div className="ov2-list">
        {loading && (
          <div className="ov2-empty" style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="ov2-empty-emoji" style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
            <p style={{ color: "#a0a0a0", margin: 0, fontSize: "14px" }}>Loading your orders…</p>
          </div>
        )}
        {error && !loading && (
          <div className="ov2-empty" style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="ov2-empty-emoji" style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <p style={{ color: "#ef4444", margin: 0, fontSize: "14px", fontWeight: "600" }}>{error}</p>
          </div>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="ov2-empty" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="ov2-empty-emoji" style={{ fontSize: "48px", marginBottom: "14px" }}>{tab === "active" ? "📭" : "🧾"}</div>
            <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{tab === "active" ? "No active orders" : "No past orders yet"}</p>
            <span style={{ color: "#666666", fontSize: "13px" }}>{tab === "active" ? "Your live orders will show up here" : "Completed orders will appear here"}</span>
          </div>
        )}
        {!loading && !error && list.map(o => (
          <OrderCard key={o.id} order={o} onUpdate={handleUpdate} reviewedIds={reviewedIds} onReviewed={markReviewed} />
        ))}
      </div>
      <div style={{ height: "20px" }} />
    </div>
  );
}