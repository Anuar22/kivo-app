import { useState, useEffect, useCallback } from "react";
import { ordersApi, subscribeOrderSSE } from "../api/index.js";
import { STATUSES, STATUS_ICONS, STATUS_COLORS } from "../data/index.js";

function OrderCard({ order, onUpdate }) {
  const statusIdx = STATUSES.indexOf(order.status);
  const isLive = !["Delivered", "Cancelled"].includes(order.status);

  // Subscribe to live updates for active orders
  useEffect(() => {
    if (!isLive) return;
    const unsub = subscribeOrderSSE(order.id, onUpdate);
    return unsub;
  }, [order.id, isLive]);

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : new Date(ts).toLocaleDateString();
  };

  return (
    <div className={`order-card ${isLive ? "order-live" : ""}`}>
      {isLive && <div className="live-badge">🔴 LIVE UPDATE</div>}

      <div className="order-header">
        <div>
          <p className="order-vendor">{order.vendor_name}</p>
          <p className="order-id">{order.ref} · {timeAgo(order.created_at)}</p>
        </div>
        <span
          className="order-status-badge"
          style={{
            background: (STATUS_COLORS[order.status] || "#666") + "22",
            color: STATUS_COLORS[order.status] || "#666",
          }}
        >
          {STATUS_ICONS[order.status] || "📋"} {order.status}
        </span>
      </div>

      {isLive && (
        <div className="status-track">
          {STATUSES.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`track-step ${i <= statusIdx ? "done" : ""} ${i === statusIdx ? "current" : ""}`}
            >
              <div className="track-dot">
                {i < statusIdx ? "✓" : i === statusIdx ? STATUS_ICONS[s] : ""}
              </div>
              <span>{s}</span>
              {i < STATUSES.length - 2 && (
                <div className={`track-line ${i < statusIdx ? "done" : ""}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="order-items">
        {order.items?.map((item, i) => (
          <div key={i} className="order-item-row">
            <span>{item.qty}× {item.name}</span>
            <span>${(Number(item.price) * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="order-total">
        <span>Total</span>
        <span>${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const active  = orders.filter(o => !["Delivered", "Cancelled"].includes(o.status));
  const history = orders.filter(o =>  ["Delivered", "Cancelled"].includes(o.status));

  return (
    <div className="page orders-page">
      <div className="orders-tabs">
        <button className={`otab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
          Active {active.length > 0 && <span className="otab-badge">{active.length}</span>}
        </button>
        <button className={`otab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
          History
        </button>
      </div>

      <div className="orders-list">
        {loading && <div className="empty-state"><p>Loading...</p></div>}
        {error   && <div className="empty-state"><p>⚠️ {error}</p></div>}

        {!loading && tab === "active" && (
          active.length === 0
            ? <div className="empty-state"><p>📭 No active orders</p><span>Active orders will appear here</span></div>
            : active.map(o => <OrderCard key={o.id} order={o} onUpdate={handleUpdate} />)
        )}
        {!loading && tab === "history" && (
          history.length === 0
            ? <div className="empty-state"><p>No past orders yet</p></div>
            : history.map(o => <OrderCard key={o.id} order={o} onUpdate={handleUpdate} />)
        )}
      </div>
    </div>
  );
}
