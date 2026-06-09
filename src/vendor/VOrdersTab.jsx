import { useState, useEffect, useCallback } from "react";
import { ordersApi, apiRequest, subscribeVendorSSE } from "../api/index.js";

function VStatusPill({ status }) {
  const map = {
    Pending:   { cls: "vpill-pending", icon: "🕐" },
    Accepted:  { cls: "vpill-cooking", icon: "✅" },
    Cooking:   { cls: "vpill-cooking", icon: "👨‍🍳" },
    Ready:     { cls: "vpill-ready",   icon: "📦" },
    Delivered: { cls: "vpill-done",    icon: "🛵" },
    Cancelled: { cls: "vpill-cancel",  icon: "❌" },
  };
  const { cls, icon } = map[status] || { cls: "vpill-pending", icon: "📋" };
  return <span className={`vorder-status-pill ${cls}`}>{icon} {status}</span>;
}

const STATUS_FLOW  = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];
const NEXT_LABEL   = { Pending: "Accept", Accepted: "Start Cooking", Cooking: "Mark Ready", Ready: "Mark Delivered" };

function StatCard({ label, value, sub, valueStyle }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueStyle}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function OrderCard({ order, onAdvance, onReject, showActions }) {
  const timeAgo = (ts) => {
    if (!ts) return "";
    const m = Math.floor((Date.now() - new Date(ts)) / 60000);
    return m < 1 ? "Just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return (
    <div className="vorder-card">
      <div className="vorder-card-header">
        <div>
          <div className="vorder-card-id">{order.ref || order.id}</div>
          <div className="vorder-card-customer">{order.customer || order.customer_name}</div>
          <div className="vorder-card-time">{order.time || timeAgo(order.created_at)}</div>
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

      {(order.address || order.delivery_address) && (
        <div style={{ padding: "0 16px 10px", fontSize: 12, color: "#7a7065" }}>
          📍 {order.address || order.delivery_address}
        </div>
      )}

      <div className="vorder-card-footer">
        <div>
          <div className="vorder-total-label">Order total</div>
          <div className="vorder-total-amount">${Number(order.total).toFixed(2)}</div>
        </div>
        {showActions && (
          <div className="action-btns">
            {order.status === "Pending" && (
              <button className="btn-reject" onClick={() => onReject(order)}>Reject</button>
            )}
            <button className="btn-accept" onClick={() => onAdvance(order)}>
              {NEXT_LABEL[order.status] || "Advance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VOrdersTab({ showToast }) {
  const [tab, setTab]         = useState("active");
  const [orders, setOrders]   = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [filter, setFilter]   = useState("All");
  const filters = ["All", "Pending", "Cooking", "Ready"];

  // ── Active orders ──────────────────────────────────────────────────────────
  const loadActive = useCallback(async () => {
    try {
      const data = await apiRequest("/api/vendor/orders");
      // Active = not delivered/cancelled/collected
      const active = data.filter(o => !["Delivered", "Collected", "Cancelled"].includes(o.status));
      setOrders(active);
    } catch {
      showToast("⚠️ Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── History + stats ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (histLoading) return;
    setHistLoading(true);
    try {
      const { orders: list, stats: s } = await apiRequest("/api/vendor/orders/history");
      setHistory(list);
      setStats(s);
    } catch {
      showToast("⚠️ Failed to load history");
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActive();
    const unsub = subscribeVendorSSE(
      (newOrder) => {
        setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
        showToast(`🔔 New order from ${newOrder.customer_name || newOrder.customer}!`);
      },
      (updated) => {
        setOrders(prev =>
          prev.map(o => o.id === updated.id ? updated : o)
              .filter(o => !["Delivered", "Collected", "Cancelled"].includes(o.status))
        );
      }
    );
    return unsub;
  }, [loadActive]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  const advance = async (order) => {
    const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
    if (!nextStatus) return;
    try {
      await apiRequest(`/api/vendor/orders/${order.id}`, { method: "PATCH", body: { status: nextStatus } });
      if (["Delivered", "Collected"].includes(nextStatus)) {
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
      await ordersApi.cancel(order.dbId || order.id);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      showToast("❌ Order rejected");
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const visible      = filter === "All" ? orders : orders.filter(o => o.status === filter);

  // ── Tab switcher UI ────────────────────────────────────────────────────────
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: "7px 18px", borderRadius: 100, border: "1.5px solid",
      borderColor: tab === id ? "#0f0f0f" : "#e8e4df",
      background: tab === id ? "#0f0f0f" : "#fff",
      color: tab === id ? "#fff" : "#7a7065",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      fontFamily: "DM Sans, sans-serif", whiteSpace: "nowrap",
    }}>{label}</button>
  );

  return (
    <div className="vd-content">
      {/* Main tabs: Active | History */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabBtn("active", `Active${orders.length > 0 ? ` (${orders.length})` : ""}`)}
        {tabBtn("history", "History")}
      </div>

      {/* ── ACTIVE TAB ─────────────────────────────────────────────────── */}
      {tab === "active" && (
        <>
          <div className="stats-row">
            <StatCard label="Pending" value={pendingCount} sub="awaiting action" valueStyle={{ color: "#ff6b35" }} />
            <StatCard label="Active" value={orders.length} sub="in progress" valueStyle={{ color: "#22c55e" }} />
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 12 }}>
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
            <OrderCard key={order.id} order={order} onAdvance={advance} onReject={reject} showActions />
          ))}
        </>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
      {tab === "history" && (
        <>
          {/* Revenue stats cards */}
          {stats && (
            <>
              <div className="stats-row">
                <StatCard label="Today's revenue" value={`$${Number(stats.todayRevenue).toFixed(2)}`} sub={`${stats.todayOrders} orders`} valueStyle={{ color: "#22c55e", fontSize: 18 }} />
                <StatCard label="This week" value={`$${Number(stats.weekRevenue).toFixed(2)}`} sub={`${stats.weekOrders} orders`} valueStyle={{ color: "#ff6b35", fontSize: 18 }} />
              </div>
              <div className="stats-row" style={{ marginTop: 0 }}>
                <StatCard label="All-time revenue" value={`$${Number(stats.totalRevenue).toFixed(2)}`} sub={`${stats.totalOrders} completed`} valueStyle={{ color: "#0f0f0f", fontSize: 18 }} />
              </div>
            </>
          )}

          <div className="vd-section-title" style={{ marginTop: 8 }}>Past Orders</div>

          {histLoading ? (
            <div className="empty-orders"><div className="emoji">⏳</div><p>Loading history...</p></div>
          ) : history.length === 0 ? (
            <div className="empty-orders">
              <div className="emoji">📋</div>
              <p>No completed orders yet</p>
              <span>Delivered and cancelled orders will appear here</span>
            </div>
          ) : history.map(order => (
            <OrderCard key={order.id} order={order} showActions={false} />
          ))}
        </>
      )}
    </div>
  );
}
