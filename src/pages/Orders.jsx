import { useState, useEffect } from "react";
import { API_BASE, STATUSES, STATUS_ICONS, STATUS_COLORS, SAMPLE_ORDERS } from "../data/index.js";

function OrderCard({ order }) {
  const statusIdx = STATUSES.indexOf(order.status);

  return (
    <div className={`order-card ${order.live ? "order-live" : ""}`}>
      {order.live && <div className="live-badge">🔴 LIVE UPDATE</div>}

      <div className="order-header">
        <div>
          <p className="order-vendor">{order.vendor}</p>
          <p className="order-id">{order.id} · {order.time}</p>
        </div>
        <span
          className="order-status-badge"
          style={{ background: STATUS_COLORS[order.status] + "22", color: STATUS_COLORS[order.status] }}
        >
          {STATUS_ICONS[order.status]} {order.status}
        </span>
      </div>

      {order.live && (
        <div className="status-track">
          {STATUSES.slice(0, -1).map((s, i) => (
            <div key={s} className={`track-step ${i <= statusIdx ? "done" : ""} ${i === statusIdx ? "current" : ""}`}>
              <div className="track-dot">
                {i < statusIdx ? "✓" : i === statusIdx ? STATUS_ICONS[s] : ""}
              </div>
              <span>{s}</span>
              {i < STATUSES.length - 2 && <div className={`track-line ${i < statusIdx ? "done" : ""}`} />}
            </div>
          ))}
        </div>
      )}

      <div className="order-items">
        {order.items.map((item, i) => (
          <div key={i} className="order-item-row">
            <span>{item.qty}× {item.name}</span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="order-total">
        <span>Total</span>
        <span>${order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    const token = localStorage.getItem("kivo_token");
    if (!token) return;

    fetch(`${API_BASE}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) return;
        const savedOrders = await response.json();
        if (savedOrders.length) setOrders(savedOrders);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (!o.live) return o;
        const idx = STATUSES.indexOf(o.status);
        if (idx < STATUSES.length - 1) {
          return { ...o, status: STATUSES[idx + 1], live: STATUSES[idx + 1] !== "Delivered" };
        }
        return o;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const active = orders.filter(o => o.status !== "Delivered");
  const history = orders.filter(o => o.status === "Delivered");

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
        {tab === "active" && (
          active.length === 0
            ? <div className="empty-state"><p>📭 No active orders</p><span>Active orders will appear here</span></div>
            : active.map(o => <OrderCard key={o.id} order={o} />)
        )}
        {tab === "history" && history.map(o => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}
