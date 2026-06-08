import { useState, useEffect, useCallback } from "react";
import { ordersApi, subscribeVendorSSE } from "../api/index.js";

function VStatusPill({ status }) {
  const map = {
    Pending:  { cls: "vpill-pending",  icon: "🕐" },
    Accepted: { cls: "vpill-cooking",  icon: "✅" },
    Cooking:  { cls: "vpill-cooking",  icon: "👨‍🍳" },
    Ready:    { cls: "vpill-ready",    icon: "📦" },
  };
  const { cls, icon } = map[status] || { cls: "vpill-pending", icon: "📋" };
  return <span className={`vorder-status-pill ${cls}`}>{icon} {status}</span>;
}

const STATUS_FLOW = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];

export default function VOrdersTab({ showToast }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const filters = ["All", "Pending", "Cooking", "Ready"];

  const load = useCallback(async () => {
    try {
      const { orders: list } = await ordersApi.vendorActive();
      setOrders(list);
    } catch (e) {
      showToast("⚠️ Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Subscribe to SSE for live incoming orders
    const unsub = subscribeVendorSSE(
      (newOrder) => {
        setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
        showToast(`🔔 New order from ${newOrder.customer_name}!`);
      },
      (updated) => {
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)
          .filter(o => !["Delivered", "Cancelled"].includes(o.status)));
      }
    );
    return unsub;
  }, [load]);

  const advance = async (order) => {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    if (!nextStatus) return;

    try {
      await ordersApi.setStatus(order.id, nextStatus);
      if (nextStatus === "Delivered") {
        setOrders(prev => prev.filter(o => o.id !== order.id));
        showToast("🛵 Order delivered — done!");
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o));
        const msgs = { Accepted: "✅ Order accepted!", Cooking: "👨‍🍳 Cooking started!", Ready: "📦 Ready for pickup!" };
        showToast(msgs[nextStatus] || "✅ Updated!");
      }
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const reject = async (order) => {
    try {
      await ordersApi.cancel(order.id);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      showToast("❌ Order rejected");
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const NEXT_LABEL = { Pending: "Accept", Accepted: "Start Cooking", Cooking: "Mark Ready", Ready: "Mark Delivered" };

  const visible = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const timeAgo = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000);
    return m < 1 ? "Just now" : m < 60 ? `${m} min ago` : `${Math.floor(m/60)}h ago`;
  };

  return (
    <div className="vd-content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value orange">{pendingCount}</div>
          <div className="stat-sub">awaiting action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value green">{orders.length}</div>
          <div className="stat-sub">in progress</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: 100, border: "1.5px solid",
            borderColor: filter === f ? "#0f0f0f" : "#e8e4df",
            background: filter === f ? "#0f0f0f" : "#fff",
            color: filter === f ? "#fff" : "#7a7065",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0, fontFamily: "DM Sans, sans-serif",
          }}>
            {f}
            {f === "Pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 5, background: "#ff6b35", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-orders"><div className="emoji">⏳</div><p>Loading orders...</p></div>
      ) : visible.length === 0 ? (
        <div className="empty-orders">
          <div className="emoji">🎉</div>
          <p>All caught up!</p>
          <span>No {filter !== "All" ? filter.toLowerCase() : ""} orders right now</span>
        </div>
      ) : visible.map(order => (
        <div key={order.id} className="vorder-card">
          <div className="vorder-card-header">
            <div>
              <div className="vorder-card-id">{order.ref}</div>
              <div className="vorder-card-customer">{order.customer_name}</div>
              <div className="vorder-card-time">{timeAgo(order.created_at)}</div>
            </div>
            <VStatusPill status={order.status} />
          </div>

          <div className="vorder-items-list">
            {order.items?.map((item, i) => (
              <div key={i} className="vorder-item-row">
                <span><span className="qty">{item.qty}×</span>{item.name}</span>
                <span className="price">${(Number(item.price) * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {order.address && (
            <div style={{ padding: "0 16px 10px", fontSize: 12, color: "#7a7065" }}>
              📍 {order.address}
            </div>
          )}

          <div className="vorder-card-footer">
            <div>
              <div className="vorder-total-label">Order total</div>
              <div className="vorder-total-amount">${Number(order.total).toFixed(2)}</div>
            </div>
            <div className="action-btns">
              {order.status === "Pending" && (
                <button className="btn-reject" onClick={() => reject(order)}>Reject</button>
              )}
              <button className="btn-accept" onClick={() => advance(order)}>
                {NEXT_LABEL[order.status] || "Advance"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
