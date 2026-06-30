import { useState, useEffect, useCallback } from "react";
import { ordersApi, subscribeOrderSSE, reviewsApi } from "../api/index.js";
import { STATUSES, STATUS_ICONS } from "../data/index.js";
import { fmt } from "../utils/currency.js";
import SuccessModal from "../components/SuccessModal.jsx";

const ordersStyleTag = document.createElement("style");
ordersStyleTag.innerHTML = `
  .orders-v2-container {
    font-family: 'DM Sans', sans-serif; background: #f7f5f2; min-height: 100vh;
    padding: 16px 16px calc(80px + env(safe-area-inset-bottom, 16px)); box-sizing: border-box;
  }
  .ov2-header { margin-bottom: 18px; }
  .ov2-title { font-size: 24px; font-weight: 800; font-family: 'Georgia', serif; margin: 0 0 14px; }
  .ov2-tabs { display: flex; gap: 8px; background: #e8e4df; padding: 4px; border-radius: 12px; }
  .ov2-tab { flex: 1; padding: 10px; border: none; background: transparent; font-weight: 600; font-size: 13px; border-radius: 10px; cursor: pointer; color: #7a7065; transition: all 0.2s; }
  .ov2-tab.active { background: white; color: #0f0f0f; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .ov2-card { background: white; border: 1px solid #e8e4df; border-radius: 18px; padding: 16px; margin-bottom: 14px; position: relative; }
  .ov2-live-badge { position: absolute; top: -8px; right: 16px; background: #e53935; color: white; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 20px; box-shadow: 0 2px 8px rgba(229,57,53,0.3); }
  .ov2-card-header { display: flex; gap: 12px; align-items: center; cursor: pointer; }
  .ov2-card-emoji { font-size: 24px; background: #f7f5f2; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .ov2-card-vendor { font-weight: 800; font-size: 15px; margin: 0 0 2px; font-family: 'Georgia', serif; }
  .ov2-card-meta { font-size: 12px; color: #7a7065; margin: 0; }
  .ov2-status-pill { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 8px; white-space: nowrap; }
  .ov2-tracker { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0 8px; margin-top: 14px; border-top: 1px solid #f7f5f2; }
  .ov2-tracker-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .ov2-tracker-dot { width: 28px; height: 28px; border-radius: 50%; background: #e8e4df; display: flex; align-items: center; justify-content: center; font-size: 11px; z-index: 2; color: #7a7065; }
  .ov2-tracker-dot.done { background: #2e7d32; color: white; }
  .ov2-tracker-dot.current { background: #e53935; color: white; box-shadow: 0 0 0 4px rgba(229,57,53,0.15); }
  .ov2-tracker-line { position: absolute; top: 14px; left: 50%; width: 100%; height: 2px; background: #e8e4df; z-index: 1; }
  .ov2-tracker-line.done { background: #2e7d32; }
  .ov2-tracker-label { font-size: 10px; font-weight: 600; color: #7a7065; margin-top: 4px; text-align: center; }
  .ov2-tracker-label.done { color: #0f0f0f; }
  .ov2-items { background: #fdfcfb; padding: 12px; border-radius: 12px; border: 1px dashed #e8e4df; margin: 12px 0; }
  .ov2-item-row { display: flex; justify-content: space-between; font-size: 13px; color: #362f2d; margin: 4px 0; }
  .ov2-item-qty { font-weight: 700; color: #e53935; }
  .ov2-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
  .ov2-expand-btn { background: none; border: none; font-size: 12px; font-weight: 700; color: #7a7065; display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .ov2-total { text-align: right; font-size: 13px; color: #7a7065; }
  .ov2-total-amount { font-size: 16px; font-weight: 800; color: #0f0f0f; margin-left: 6px; }
  .ov2-review-box { background: #fff8f5; border: 1px solid #ffe8da; border-radius: 14px; padding: 14px; margin-top: 14px; }
  .ov2-review-title { font-weight: 700; font-size: 13px; margin: 0 0 8px; }
  .ov2-review-submit { width: 100%; background: #e53935; color: white; border: none; padding: 10px; border-radius: 10px; font-weight: 700; margin-top: 10px; cursor: pointer; }
  .ov2-empty { text-align: center; padding: 60px 20px; color: #7a7065; }
  .ov2-empty-emoji { font-size: 48px; margin-bottom: 12px; }
  .ov2-reviewed-note { font-size: 12px; color: #2e7d32; font-weight: 700; margin: 12px 0 0; }
`;
document.head.appendChild(ordersStyleTag);

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
  Preparing: { bg: "#fff3e0", color: "#e65100" },
  Ready:     { bg: "#e3f2fd", color: "#1565c0" },
  Delivered: { bg: "#e8f5e9", color: "#2e7d32" },
  Cancelled: { bg: "#fdecea", color: "#c62828" },
};

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 22, opacity: n <= value ? 1 : 0.25, lineHeight: 1 }}>⭐</button>
      ))}
    </div>
  );
}

function ReviewBox({ orderId, onDone }) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!rating) { setError("Pick a star rating first."); return; }
    setSaving(true); setError("");
    try {
      await reviewsApi.submit(orderId, { rating, comment });
      onDone();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="ov2-review-box">
      <p className="ov2-review-title">Rate your order</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea rows={2} placeholder="Tell others about your experience (optional)" value={comment} onChange={e => setComment(e.target.value)} style={{ marginTop: 10, resize: "none", width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: "1px solid #e8e4df", fontFamily: "inherit" }} />
      {error && <p style={{ color: "#e53935", fontSize: 12, marginTop: 6 }}>{error}</p>}
      <button className="ov2-review-submit" onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit Review"}</button>
    </div>
  );
}

function StatusTracker({ status }) {
  const idx = STATUSES.indexOf(status);
  const steps = STATUSES.slice(0, -1);
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
  }, [order.id, isLive, onUpdate]);

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
        </button>
        <div className="ov2-total"><span>Total</span><span className="ov2-total-amount">{fmt(order.total)}</span></div>
      </div>

      {isDelivered && !alreadyReviewed && <ReviewBox orderId={order.id} onDone={() => { onReviewed(order.id); setShowSuccess(true); }} />}
      {isDelivered && alreadyReviewed && <p className="ov2-reviewed-note">✓ You reviewed this order</p>}
      {showSuccess && <SuccessModal title="Thanks!" message="Your review has been submitted successfully." buttonLabel="Done" onClose={() => setShowSuccess(false)} />}
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
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = useCallback((updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }, []);

  const markReviewed = (id) => {
    setReviewedIds(prev => {
      const next = new Set(prev); next.add(id);
      localStorage.setItem("kivo_reviewed", JSON.stringify([...next]));
      return next;
    });
  };

  const active  = orders.filter(o => !["Delivered", "Cancelled"].includes(o.status));
  const history = orders.filter(o =>  ["Delivered", "Cancelled"].includes(o.status));
  const list    = tab === "active" ? active : history;

  return (
    <div className="orders-v2-container">
      <div className="ov2-header">
        <p className="ov2-title">My Orders</p>
        <div className="ov2-tabs">
          <button className={`ov2-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Active ({active.length})</button>
          <button className={`ov2-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>History</button>
        </div>
      </div>
      <div className="ov2-list">
        {loading && <div className="ov2-empty"><div className="ov2-empty-emoji">⏳</div><p>Loading your orders…</p></div>}
        {error && <div className="ov2-empty"><div className="ov2-empty-emoji">⚠️</div><p>{error}</p></div>}
        {!loading && list.length === 0 && (
          <div className="ov2-empty">
            <div className="ov2-empty-emoji">{tab === "active" ? "📭" : "🧾"}</div>
            <p>Empty List</p>
          </div>
        )}
        {!loading && list.map(o => <OrderCard key={o.id} order={o} onUpdate={handleUpdate} reviewedIds={reviewedIds} onReviewed={markReviewed} />)}
      </div>
    </div>
  );
}