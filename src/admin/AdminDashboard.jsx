import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../api/index.js";
import { useAccount } from "../context/AccountContext.jsx";

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ flex: 1 }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accent || "var(--text)" }}>{value}</div>
    </div>
  );
}

function OverviewTab({ showToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch(e => showToast("⚠️ " + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-orders"><div className="emoji">⏳</div><p>Loading stats…</p></div>;
  if (!stats) return null;

  return (
    <div className="vd-content">
      <div className="stats-row">
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Vendors" value={stats.vendors} />
      </div>
      <div className="stats-row">
        <StatCard label="Pending approval" value={stats.pendingVendors} accent={stats.pendingVendors > 0 ? "#e53935" : undefined} />
        <StatCard label="Banned users" value={stats.bannedUsers} accent={stats.bannedUsers > 0 ? "#e53935" : undefined} />
      </div>
      <div className="stats-row">
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard label="Revenue (delivered)" value={`TSh ${Number(stats.totalRevenue).toLocaleString()}`} />
      </div>
    </div>
  );
}

function VendorsTab({ showToast }) {
  const [filter, setFilter] = useState("pending");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listVendors(filter === "all" ? null : filter)
      .then(({ vendors }) => setVendors(vendors))
      .catch(e => showToast("⚠️ " + e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, approved) => {
    try {
      await adminApi.approveVendor(id, approved);
      showToast(approved ? "✅ Vendor approved" : "❌ Vendor rejected");
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  return (
    <div className="vd-content">
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["pending", "approved", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: 100, border: "1.5px solid",
              borderColor: filter === f ? "var(--orange)" : "var(--border)",
              background: filter === f ? "var(--orange)" : "var(--card)",
              color: filter === f ? "white" : "var(--muted)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "DM Sans, sans-serif", textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-orders"><div className="emoji">⏳</div><p>Loading vendors…</p></div>
      ) : vendors.length === 0 ? (
        <div className="empty-orders"><div className="emoji">🏪</div><p>No vendors here</p></div>
      ) : (
        vendors.map(v => (
          <div key={v.id} className="vorder-card" style={{ marginBottom: 12 }}>
            <div className="vorder-card-header">
              <div>
                <div className="vorder-card-id">{v.name}</div>
                <div className="vorder-card-customer">{v.email}</div>
                <div className="vorder-card-time">{v.category || "No category set"}</div>
              </div>
              <span className={`vorder-status-pill ${v.is_approved ? "vpill-ready" : "vpill-pending"}`}>
                {v.is_approved ? "✅ Approved" : "🕐 Pending"}
              </span>
            </div>
            {!v.is_approved && (
              <div className="vorder-card-footer">
                <div />
                <div className="action-btns">
                  <button className="btn-reject" onClick={() => decide(v.id, false)}>Reject</button>
                  <button className="btn-accept" onClick={() => decide(v.id, true)}>Approve</button>
                </div>
              </div>
            )}
            {v.is_approved && (
              <div className="vorder-card-footer">
                <div />
                <button className="btn-reject" onClick={() => decide(v.id, false)}>Revoke approval</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function UsersTab({ showToast }) {
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    adminApi.listUsers(params)
      .then(({ users }) => setUsers(users))
      .catch(e => showToast("⚠️ " + e.message))
      .finally(() => setLoading(false));
  }, [roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const toggleBan = async (u) => {
    try {
      await adminApi.banUser(u.id, !u.is_banned);
      showToast(u.is_banned ? "✅ User unbanned" : "🚫 User banned");
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x));
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} (${u.email})? This also deletes their order history and can't be undone.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      showToast("🗑 Account deleted");
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      showToast("⚠️ " + e.message);
    }
  };

  return (
    <div className="vd-content">
      <input
        className="form-input"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["", "All"], ["customer", "Customers"], ["vendor", "Vendors"], ["admin", "Admins"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setRoleFilter(val)}
            style={{
              padding: "7px 14px", borderRadius: 100, border: "1.5px solid",
              borderColor: roleFilter === val ? "var(--orange)" : "var(--border)",
              background: roleFilter === val ? "var(--orange)" : "var(--card)",
              color: roleFilter === val ? "white" : "var(--muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-orders"><div className="emoji">⏳</div><p>Loading users…</p></div>
      ) : users.length === 0 ? (
        <div className="empty-orders"><div className="emoji">👤</div><p>No users found</p></div>
      ) : (
        users.map(u => (
          <div key={u.id} className="vorder-card" style={{ marginBottom: 10 }}>
            <div className="vorder-card-header">
              <div>
                <div className="vorder-card-id">{u.name}</div>
                <div className="vorder-card-customer">{u.email}</div>
                <div className="vorder-card-time" style={{ textTransform: "capitalize" }}>{u.role}</div>
              </div>
              <span className={`vorder-status-pill ${u.is_banned ? "vpill-cancel" : "vpill-ready"}`}>
                {u.is_banned ? "🚫 Banned" : "✅ Active"}
              </span>
            </div>
            {u.role !== "admin" && (
              <div className="vorder-card-footer">
                <div />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={u.is_banned ? "btn-accept" : "btn-reject"}
                    onClick={() => toggleBan(u)}
                  >
                    {u.is_banned ? "Unban" : "Ban"}
                  </button>
                  <button className="btn-reject" onClick={() => deleteUser(u)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminDashboard({ showToast }) {
  const { user, logout } = useAccount();
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "vendors",  label: "Vendors" },
    { id: "users",    label: "Users" },
  ];

  return (
    <>
      <div className="vd-header">
        <div className="vd-header-top">
          <div className="vd-logo">Kivo<span> Admin</span></div>
          <button className="vendor-badge" onClick={logout}>
            <div className="online-dot" />{user?.name || "Admin"}
          </button>
        </div>
        <div className="vd-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`vd-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab showToast={showToast} />}
      {tab === "vendors"  && <VendorsTab  showToast={showToast} />}
      {tab === "users"    && <UsersTab    showToast={showToast} />}
    </>
  );
}
