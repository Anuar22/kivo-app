import { useState } from "react";
import { API_BASE, VSTATUS_NEXT, VSTATUS_NEXT_LABEL } from "../data/index.js";

function VStatusPill({ status }) {
  const cls = status === "Pending" ? "vpill-pending" : status === "Cooking" ? "vpill-cooking" : "vpill-ready";
  const icons = { Pending: "🕐", Cooking: "👨‍🍳", Ready: "📦" };
  return <span className={`vorder-status-pill ${cls}`}>{icons[status]} {status}</span>;
}

export default function VOrdersTab({ vorders, setVorders, showToast }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Pending", "Cooking", "Ready"];

  const syncStatus = async (id, status) => {
    const token = localStorage.getItem("kivo_token");
    if (!token) return;
    await fetch(`${API_BASE}/api/vendor/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const accept = (id) => {
    setVorders(prev => prev.map(o => o.id === id ? { ...o, status: "Cooking" } : o));
    syncStatus(id, "Cooking");
    showToast("✅ Order accepted — start cooking!");
  };

  const reject = (id) => {
    setVorders(prev => prev.filter(o => o.id !== id));
    showToast("❌ Order rejected & removed");
  };

  const advance = (id) => {
    setVorders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = VSTATUS_NEXT[o.status];
      if (!next) return o;
      if (next === "Collected") {
        showToast("🛵 Order collected — done!");
        syncStatus(id, "Collected");
        return null;
      }
      showToast(next === "Ready" ? "📦 Order marked ready for pickup!" : "✅ Done!");
      syncStatus(id, next);
      return { ...o, status: next };
    }).filter(Boolean));
  };

  const visible = filter === "All" ? vorders : vorders.filter(o => o.status === filter);
  const pendingCount = vorders.filter(o => o.status === "Pending").length;

  return (
    <div className="vd-content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value orange">{vorders.filter(o => o.status === "Pending").length}</div>
          <div className="stat-sub">awaiting action</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's orders</div>
          <div className="stat-value green">{vorders.length + 3}</div>
          <div className="stat-sub">+3 completed</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: 100, border: "1.5px solid",
              borderColor: filter === f ? "#0f0f0f" : "#e8e4df",
              background: filter === f ? "#0f0f0f" : "#fff",
              color: filter === f ? "#fff" : "#7a7065",
              fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              flexShrink: 0, fontFamily: "DM Sans, sans-serif",
            }}
          >
            {f}
            {f === "Pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 5, background: "#ff6b35", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-orders">
          <div className="emoji">🎉</div>
          <p>All caught up!</p>
          <span>No {filter !== "All" ? filter.toLowerCase() : ""} orders right now</span>
        </div>
      ) : visible.map(order => (
        <div key={order.id} className="vorder-card">
          <div className="vorder-card-header">
            <div>
              <div className="vorder-card-id">{order.id}</div>
              <div className="vorder-card-customer">{order.customer}</div>
              <div className="vorder-card-time">{order.time}</div>
            </div>
            <VStatusPill status={order.status} />
          </div>

          <div className="vorder-items-list">
            {order.items.map((item, i) => (
              <div key={i} className="vorder-item-row">
                <span><span className="qty">{item.qty}×</span>{item.name}</span>
                <span className="price">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="vorder-card-footer">
            <div>
              <div className="vorder-total-label">Order total</div>
              <div className="vorder-total-amount">${order.total.toFixed(2)}</div>
            </div>
            <div className="action-btns">
              {order.status === "Pending" ? (
                <>
                  <button className="btn-reject" onClick={() => reject(order.id)}>Reject</button>
                  <button className="btn-accept" onClick={() => accept(order.id)}>Accept</button>
                </>
              ) : (
                <button className="btn-advance" onClick={() => advance(order.id)}>
                  {VSTATUS_NEXT_LABEL[order.status]}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
