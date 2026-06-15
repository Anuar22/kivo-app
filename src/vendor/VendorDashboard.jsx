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
    <>
      <div className="vd-header">
        <div className="vd-header-top">
          <div className="vd-logo">Kivo<span> Vendor</span></div>
          <button className="vendor-badge" onClick={logout}>
            <div className="online-dot" />{businessName}
          </button>
        </div>
        <div className="vd-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`vd-tab ${vtab === t.id ? "active" : ""}`}
              onClick={() => setVtab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {vtab === "orders"  && <VOrdersTab  showToast={showToast} />}
      {vtab === "menu"    && <VMenuTab    showToast={showToast} />}
      {vtab === "profile" && <VProfileTab showToast={showToast} />}
    </>
  );
}
