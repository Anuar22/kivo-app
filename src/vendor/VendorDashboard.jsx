import { useState } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import VOrdersTab  from "./VOrdersTab.jsx";
import VMenuTab    from "./VMenuTab.jsx";
import VProfileTab from "./VProfileTab.jsx";

export default function VendorDashboard({ showToast }) {
  const { user, logout } = useAccount();
  const [vtab, setVtab] = useState("orders");
  const businessName = user?.businessName || user?.name || "My Restaurant";

  return (
    <>
      <div className="vd-header">
        <div className="vd-header-top">
          <div className="vd-logo">
            <span>K</span><em>ivo</em>{" "}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "DM Sans, sans-serif", fontWeight: 400 }}>Vendor</span>
          </div>
          <button className="vendor-badge" onClick={logout}>
            <div className="online-dot" />{businessName}
          </button>
        </div>
        <div className="vd-tabs">
          <button className={`vd-tab ${vtab === "orders"  ? "active" : ""}`} onClick={() => setVtab("orders")}>Orders</button>
          <button className={`vd-tab ${vtab === "menu"    ? "active" : ""}`} onClick={() => setVtab("menu")}>Menu</button>
          <button className={`vd-tab ${vtab === "profile" ? "active" : ""}`} onClick={() => setVtab("profile")}>Profile</button>
        </div>
      </div>

      {vtab === "orders"  && <VOrdersTab  showToast={showToast} />}
      {vtab === "menu"    && <VMenuTab    showToast={showToast} />}
      {vtab === "profile" && <VProfileTab showToast={showToast} />}
    </>
  );
}
