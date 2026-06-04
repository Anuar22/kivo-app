import { useEffect, useState } from "react";
import { API_BASE, INITIAL_VORDERS, INITIAL_VMENU } from "../data/index.js";
import { useAccount } from "../context/useAccount.js";
import VOrdersTab from "./VOrdersTab.jsx";
import VMenuTab from "./VMenuTab.jsx";

export default function VendorDashboard({ showToast }) {
  const { user, logout } = useAccount();
  const [vtab, setVtab] = useState("orders");
  const [vorders, setVorders] = useState(INITIAL_VORDERS);
  const [vmenu, setVmenu] = useState(INITIAL_VMENU);

  const pendingCount = vorders.filter(o => o.status === "Pending").length;
  const businessName = user?.businessName || "Vendor account";

  useEffect(() => {
    const token = localStorage.getItem("kivo_token");
    if (!token) return;

    Promise.all([
      fetch(`${API_BASE}/api/vendor/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/vendor/menu`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([ordersRes, menuRes]) => {
        if (ordersRes.ok) setVorders(await ordersRes.json());
        if (menuRes.ok) setVmenu(await menuRes.json());
      })
      .catch(() => showToast("Using local vendor data"));
  }, [showToast]);

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
          <button className={`vd-tab ${vtab === "orders" ? "active" : ""}`} onClick={() => setVtab("orders")}>
            Orders {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
          <button className={`vd-tab ${vtab === "menu" ? "active" : ""}`} onClick={() => setVtab("menu")}>
            Menu
          </button>
        </div>
      </div>

      {vtab === "orders" && <VOrdersTab vorders={vorders} setVorders={setVorders} showToast={showToast} />}
      {vtab === "menu" && <VMenuTab vmenu={vmenu} setVmenu={setVmenu} showToast={showToast} />}
    </>
  );
}
