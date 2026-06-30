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

const STATUS_STYLE = {
  Pending:   { bg: "#fff8e1", color: "#b8860b" },
  Accepted:  { bg: "#e8f5e9", color: "#2e7d32" },
  Preparing:   { bg: "#fff3e0", color: "#e65100" },
  Ready:     { bg: "#e3f2fd", color: "#1565c0" },
  Delivered: { bg: "#e8f5e9", color: "#2e7d32" },
  Cancelled: { bg: "#fdecea", color: "#c62828" },
};

// ── Inline star rating picker ─────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 22, opacity: n <= value ? 1 : 0.25, lineHeight: 1 }}
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
    <div className="ov2-review-box">
      <p className="ov2-review-title">Rate your order</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        className="pv2-input"
        rows={2}
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ marginTop: 10, resize: "none", fontFamily: "DM Sans, sans-serif" }}
      />
      {error && <p style={{ color: "#e53935", fontSize: 12, marginTop: 6 }}>{error}</p>}
      <button className="ov2-review-submit" onClick={submit} disabled={saving}>
        {saving ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

// ── Status progress tracker ─────────────────────────────────────────────────
function StatusTracker({ status }) {
  const idx = STATUSES.indexOf(status);
  const steps = STATUSES.slice(0, -1); // exclude "Delivered" as final dot is implicit
  return (
    <div className="ov2-tracker">
      {steps.map((s, i) => (
        <div key={s} className="ov2-tracker-step">
          <div className={`ov2-tracker-dot ${i <= idx ? "done" : ""} ${i === idx ? "current" : ""}`}>
            {i < idx ? "✓" : STATUS_ICONS[s]}
          </div>
          <span className={i <= idx ? "ov2-tracker-label done" : "ov2-tracker-label"}>{s}</span>
          {i < steps.length - 1 && <div className={`ov2-tracker-line ${i < idx ? "done" : ""}`} />}
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
  const style = STATUS_STYLE[order.status] || { bg: "#f5f5f5", color: "#888" };
  const alreadyReviewed = reviewedIds.has(order.id);

  useEffect(() => {
    if (!isLive) return;
    const unsub = subscribeOrderSSE(order.id, onUpdate);
    return unsub;
  }, [order.id, isLive]);

  return (
    <div className="ov2-card">
      {isLive && <div className="ov2-live-badge">🔴 Live tracking</div>}

      <div className="ov2-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="ov2-card-emoji">🍽️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="ov2-card-vendor">{order.vendor_name}</p>
          <p className="ov2-card-meta">{order.ref} · {timeAgo(order.created_at)}</p>
        </div>
        <span className="ov2-status-pill" style={{ background: style.bg, color: style.color }}>
          {STATUS_ICONS[order.status] || "📋"} {order.status}
        </span>
      </div>

      {isLive && <StatusTracker status={order.status} />}

      {expanded && (
        <div className="ov2-items">
          {order.items?.map((item, i) => (
            <div key={i} className="ov2-item-row">
              <span><span className="ov2-item-qty">{item.qty}×</span> {item.name}</span>
              <span>{fmt(Number(item.price) * item.qty)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ov2-card-footer">
        <button className="ov2-expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? "Hide items" : "View items"}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div className="ov2-total">
          <span>Total</span>
          <span className="ov2-total-amount">{fmt(order.total)}</span>
        </div>
      </div>

      {/* Review CTA for delivered orders */}
      {isDelivered && !alreadyReviewed && (
        <ReviewBox orderId={order.id} onDone={() => { onReviewed(order.id); setShowSuccess(true); }} />
      )}
      {isDelivered && alreadyReviewed && (
        <p className="ov2-reviewed-note">✓ You reviewed this order</p>
      )}

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
    <div className="orders-v2">
      <div className="ov2-header">
        <p className="ov2-title">My Orders</p>
        <div className="ov2-tabs">
          <button className={`ov2-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
            Active{active.length > 0 ? ` (${active.length})` : ""}
          </button>
          <button className={`ov2-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            History
          </button>
        </div>
      </div>

      <div className="ov2-list">
        {loading && (
          <div className="ov2-empty"><div className="ov2-empty-emoji">⏳</div><p>Loading your orders…</p></div>
        )}
        {error && !loading && (
          <div className="ov2-empty"><div className="ov2-empty-emoji">⚠️</div><p>{error}</p></div>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="ov2-empty">
            <div className="ov2-empty-emoji">{tab === "active" ? "📭" : "🧾"}</div>
            <p>{tab === "active" ? "No active orders" : "No past orders yet"}</p>
            <span>{tab === "active" ? "Your live orders will show up here" : "Completed orders will appear here"}</span>
          </div>
        )}
        {!loading && !error && list.map(o => (
          <OrderCard key={o.id} order={o} onUpdate={handleUpdate} reviewedIds={reviewedIds} onReviewed={markReviewed} />
        ))}
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
