import { useState } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import VOrdersTab  from "./VOrdersTab.jsx";
import VMenuTab    from "./VMenuTab.jsx";
import VProfileTab from "./VProfileTab.jsx";

export default function VendorDashboard({ showToast }) {
  const { user, logout } = useAccount();
  const [vtab, setVtab] = useState("orders");
  const businessName = user?.businessName || user?.name || "My Restaurant";

  const tabs = [
    { id: "orders",  label: "Orders" },
    { id: "menu",    label: "Menu" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div 
      className="page vendor-dashboard" 
      style={{
        background: "#000000",
        backgroundColor: "#000000",
        minHeight: "100vh",
        color: "#ffffff",
        /* 🛠️ THE FIX: Neutralizes global layout spacer padding boundaries cleanly */
        margin: 0,
        padding: "0 16px 100px",
        paddingTop: "24px",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
        boxSizing: "border-box"
      }}
    >
      {/* ── TOP NAV HEADER ROW ── */}
      <div className="vd-header" style={{ marginBottom: "20px" }}>
        <div className="vd-header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div className="vd-logo" style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.4px" }}>
            Kivo<span style={{ color: "#e53935" }}> Vendor</span>
          </div>
          <button 
            className="vendor-badge" 
            onClick={logout}
            style={{ 
              background: "#121212", 
              border: "1px solid #222222", 
              borderRadius: "12px", 
              padding: "6px 14px", 
              color: "#ffffff", 
              fontSize: "13px", 
              fontWeight: "700", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)" 
            }}
          >
            <div className="online-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a" }} />
            {businessName}
          </button>
        </div>

        {/* ── METRICS SURFACE SECTION CARD ── */}
        <div className="dashboard-surface" style={{ background: "#121212", border: "1px solid #222222", borderRadius: "16px", padding: "18px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
          <div className="label" style={{ fontSize: "11px", fontWeight: "700", color: "#e53935", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Today at a glance</div>
          <div className="title" style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>Welcome back, {businessName}</div>
          <div className="copy" style={{ fontSize: "13px", color: "#a0a0a0", lineHeight: "1.5" }}>Keep orders moving, update your menu, and make your restaurant page feel fresh for customers.</div>
        </div>

        {/* ── PREMIUM RED ACCENT SEGMENTED TABS ── */}
        <div className="vd-tabs" style={{ display: "flex", background: "#121212", border: "1px solid #222222", padding: "4px", borderRadius: "12px" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`vd-tab ${vtab === t.id ? "active" : ""}`}
              onClick={() => setVtab(t.id)}
              style={{ 
                flex: 1, 
                padding: "10px 0", 
                border: "none", 
                borderRadius: "9px", 
                fontWeight: "700", 
                fontSize: "13px", 
                cursor: "pointer", 
                background: vtab === t.id ? "#e53935" : "transparent", 
                color: vtab === t.id ? "#ffffff" : "#a0a0a0", 
                transition: "0.2s",
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONDITIONAL VIEW SWITCHERS ── */}
      <div className="vd-tab-content">
        {vtab === "orders"  && <VOrdersTab  showToast={showToast} />}
        {vtab === "menu"    && <VMenuTab    showToast={showToast} />}
        {vtab === "profile" && <VProfileTab showToast={showToast} />}
      </div>
    </div>
  );
}