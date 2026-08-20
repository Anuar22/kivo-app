import { useState, useEffect, useCallback } from "react";
import { ordersApi, subscribeVendorSSE } from "../api/index.js";
import { fmt } from "../utils/currency.js";

// ── MODERN DARK STATUS PILL COMPONENT ────────────────────────────────────────
function VStatusPill({ status }) {
  const map = {
    Pending:   { bg: "rgba(255, 179, 0, 0.12)",  color: "#ffb300", icon: "🕐" },
    Accepted:  { bg: "rgba(22, 163, 74, 0.12)",   color: "#16a34a", icon: "✅" },
    Cooking:   { bg: "rgba(249, 115, 22, 0.12)",  color: "#f97316", icon: "👨‍🍳" },
    Ready:     { bg: "rgba(37, 99, 235, 0.12)",   color: "#2563eb", icon: "📦" },
    Delivered: { bg: "rgba(22, 163, 74, 0.12)",   color: "#16a34a", icon: "🛵" },
    Cancelled: { bg: "rgba(239, 68, 68, 0.12)",   color: "#ef4444", icon: "❌" },
  };
  const { bg, color, icon } = map[status] || { bg: "#222222", color: "#a0a0a0", icon: "📋" };
  return (
    <span 
      style={{ 
        background: bg, 
        color: color, 
        padding: "5px 12px", 
        borderRadius: "8px", 
        fontSize: "12px", 
        fontWeight: "700", 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "4px" 
      }}
    >
      {icon} {status}
    </span>
  );
}

const STATUS_FLOW  = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];
const NEXT_LABEL   = { Pending: "Accept", Accepted: "Start Cooking", Cooking: "Mark Ready", Ready: "Mark Delivered" };

// ── MODERN STAT CARD ENTRY ───────────────────────────────────────────────────
function StatCard({ label, value, sub, valueStyle }) {
  return (
    <div className="stat-card" style={{ flex: 1, background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      <div className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div className="stat-value" style={{ fontSize: "22px", fontWeight: "800", margin: "4px 0 2px", ...valueStyle }}>{value}</div>
      <div className="stat-sub" style={{ fontSize: "11px", color: "#666666" }}>{sub}</div>
    </div>
  );
}

// ── MODERN DARK ORDER CARD ───────────────────────────────────────────────────
function OrderCard({ order, onAdvance, onReject, showActions }) {
  const timeAgo = (ts) => {
    if (!ts) return "";
    const m = Math.floor((Date.now() - new Date(ts)) / 60000);
    return m < 1 ? "Just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const minutesOld = order.created_at ? Math.floor((Date.now() - new Date(order.created_at)) / 60000) : 0;
  const isUrgent = order.status === "Pending" && minutesOld >= 10;

  const isPickup = order.fulfillment_type === "pickup";
  const paymentLabel = { cash: "Cash", card: "Card", mobile: "Mobile Money" }[order.payment_method] || order.payment_method;

  return (
    <div
      className="vorder-card"
      style={{
        background: "#121212",
        border: isUrgent ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid #222222",
        borderRadius: "16px",
        marginBottom: "14px",
        overflow: "hidden",
        boxShadow: isUrgent ? "0 0 0 1px rgba(239,68,68,0.15), 0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {isUrgent && (
        <div style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", fontSize: "11px", fontWeight: "700", padding: "6px 16px", display: "flex", alignItems: "center", gap: "5px" }}>
          ⏱️ Waiting {minutesOld} min — needs attention
        </div>
      )}
      <div className="vorder-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px", borderBottom: "1px solid #1a1a1a" }}>
        <div>
          <div className="vorder-card-id" style={{ color: "#ffffff", fontWeight: "800", fontSize: "15px", letterSpacing: "-0.2px" }}>{order.ref || order.id}</div>
          <div className="vorder-card-customer" style={{ color: "#ffffff", fontWeight: "600", fontSize: "13px", marginTop: "2px" }}>{order.customer || order.customer_name}</div>
          <div className="vorder-card-time" style={{ color: "#666666", fontSize: "11px", marginTop: "1px" }}>{order.time || timeAgo(order.created_at)}</div>
        </div>
        <VStatusPill status={order.status} />
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "10px 16px 0" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: isPickup ? "rgba(37, 99, 235, 0.12)" : "rgba(22, 163, 74, 0.12)", color: isPickup ? "#2563eb" : "#16a34a", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "7px" }}>
          {isPickup ? "🏪 Self Pick-Up" : "🛵 Delivery"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#1a1a1a", color: "#a0a0a0", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "7px" }}>
          💳 {paymentLabel}
        </span>
      </div>

      <div className="vorder-items-list" style={{ background: "#0a0a0a", padding: "12px 16px", marginTop: "10px" }}>
        {order.items?.map((item, i) => (
          <div key={i} className="vorder-item-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", color: "#a0a0a0" }}>
            <span><span className="qty" style={{ color: "#e53935", fontWeight: "700", marginRight: "6px" }}>{item.qty}×</span>{item.name}</span>
            <span className="price" style={{ color: "#ffffff", fontWeight: "600" }}>{fmt(Number(item.price) * item.qty)}</span>
          </div>
        ))}
      </div>

      {!isPickup && (order.address || order.delivery_address) && (
        <div style={{ padding: "12px 16px 4px", fontSize: "12px", color: "#a0a0a0", borderTop: "1px solid #1a1a1a" }}>
          📍 {order.address || order.delivery_address}
        </div>
      )}

      <div className="vorder-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#161616", borderTop: "1px solid #1a1a1a" }}>
        <div>
          <div className="vorder-total-label" style={{ fontSize: "11px", color: "#666666", textTransform: "uppercase" }}>Order total</div>
          <div className="vorder-total-amount" style={{ color: "#ffffff", fontWeight: "800", fontSize: "16px" }}>{fmt(order.total)}</div>
        </div>
        {showActions && (
          <div className="action-btns" style={{ display: "flex", gap: "8px" }}>
            {order.status === "Pending" && (
              <button className="btn-reject" onClick={() => onReject(order)} style={{ background: "transparent", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Reject</button>
            )}
            <button className="btn-accept" onClick={() => onAdvance(order)} style={{ background: "#e53935", border: "none", color: "#ffffff", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 8px rgba(229,57,53,0.2)" }}>
              {NEXT_LABEL[order.status] || "Advance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN VENDORS ORDER TAB SWITCHER ──────────────────────────────────────────
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
      const { orders: data } = await ordersApi.vendorActive();
      const active = data.filter(o => !["Delivered", "Cancelled"].includes(o.status));
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
      const { orders: list, stats: s } = await ordersApi.vendorHistory();
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
    <button 
      key={id} 
      onClick={() => setTab(id)} 
      style={{
        padding: "8px 20px", 
        borderRadius: "100px", 
        border: "1px solid",
        borderColor: tab === id ? "#e53935" : "#222222",
        background: tab === id ? "#e53935" : "#121212",
        color: tab === id ? "#ffffff" : "#a0a0a0",
        fontSize: "13px", 
        fontWeight: "700", 
        cursor: "pointer",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)", 
        whiteSpace: "nowrap",
        transition: "0.2s"
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="vd-content" style={{ marginTop: "12px" }}>
      {/* Main toggle sub-tabs: Active | History */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {tabBtn("active", `Active${orders.length > 0 ? ` (${orders.length})` : ""}`)}
        {tabBtn("history", "History")}
      </div>

      {/* ── ACTIVE ORDERS CONTENT PANEL ── */}
      {tab === "active" && (
        <>
          <div className="stats-row" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <StatCard label="Pending" value={pendingCount} sub="awaiting action" valueStyle={{ color: "#ffb300" }} />
            <StatCard label="Active" value={orders.length} sub="in progress" valueStyle={{ color: "#16a34a" }} />
          </div>

          {/* Filtering Horizontal Chips Scroller */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", marginBottom: "16px", paddingBottom: "4px" }}>
            {filters.map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                style={{
                  padding: "6px 14px", 
                  borderRadius: "100px", 
                  border: "1px solid",
                  borderColor: filter === f ? "#ffffff" : "#222222",
                  background: filter === f ? "#ffffff" : "#121212",
                  color: filter === f ? "#000000" : "#a0a0a0",
                  fontSize: "12px", 
                  fontWeight: "700", 
                  cursor: "pointer",
                  whiteSpace: "nowrap", 
                  flexShrink: 0, 
                  fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                  transition: "0.15s"
                }}
              >
                {f}
                {f === "Pending" && pendingCount > 0 && (
                  <span style={{ marginLeft: "6px", background: "#e53935", color: "#ffffff", fontSize: "10px", fontWeight: "800", borderRadius: "50%", width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-orders" style={{ textAlign: "center", padding: "40px 0" }}><div className="emoji" style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div><p style={{ color: "#a0a0a0", margin: 0 }}>Loading orders...</p></div>
          ) : visible.length === 0 ? (
            <div className="empty-orders" style={{ textAlign: "center", padding: "50px 20px" }}>
              <div className="emoji" style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
              <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>All caught up!</p>
              <span style={{ color: "#666666", fontSize: "13px" }}>No {filter !== "All" ? filter.toLowerCase() : ""} orders right now</span>
            </div>
          ) : visible.map(order => (
            <OrderCard key={order.id} order={order} onAdvance={advance} onReject={reject} showActions />
          ))}
        </>
      )}

      {/* ── ARCHIVE HISTORY CONTENT PANEL ── */}
      {tab === "history" && (
        <>
          {stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div className="stats-row" style={{ display: "flex", gap: "12px" }}>
                <StatCard label="Today's revenue" value={fmt(stats.todayRevenue)} sub={`${stats.todayOrders} orders`} valueStyle={{ color: "#16a34a" }} />
                <StatCard label="This week" value={fmt(stats.weekRevenue)} sub={`${stats.weekOrders} orders`} valueStyle={{ color: "#e53935" }} />
              </div>
              <div className="stats-row" style={{ display: "flex" }}>
                <StatCard label="All-time revenue" value={fmt(stats.totalRevenue)} sub={`${stats.totalOrders} completed`} valueStyle={{ color: "#ffffff" }} />
              </div>
            </div>
          )}

          <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#666666", marginBottom: "12px", marginTop: "8px" }}>Past Orders</div>

          {histLoading ? (
            <div className="empty-orders" style={{ textAlign: "center", padding: "40px 0" }}><div className="emoji" style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div><p style={{ color: "#a0a0a0", margin: 0 }}>Loading history...</p></div>
          ) : history.length === 0 ? (
            <div className="empty-orders" style={{ textAlign: "center", padding: "50px 20px" }}>
              <div className="emoji" style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <p style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>No completed orders yet</p>
              <span style={{ color: "#666666", fontSize: "13px" }}>Delivered and cancelled orders will appear here</span>
            </div>
          ) : history.map(order => (
            <OrderCard key={order.id} order={order} showActions={false} />
          ))}
        </>
      )}
    </div>
  );
}