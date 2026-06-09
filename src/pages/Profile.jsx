import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { apiRequest } from "../api/index.js";

const PROFILE_SECTIONS = [
  { title: "Account", items: [{ icon: "📍", label: "Saved Addresses" }, { icon: "💳", label: "Payment Methods" }] },
  { title: "Support", items: [{ icon: "💬", label: "Help & Support" }, { icon: "📄", label: "Terms & Privacy" }, { icon: "🔔", label: "Notifications" }] },
];

export default function Profile() {
  const { user, logout } = useAccount();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: user.name, phone: user.phone || "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [stats, setStats]     = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/me/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/auth/me/update", { method: "PATCH", body: form });
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
        <div className="profile-info">
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 15, fontWeight: 700, width: "100%", outline: "none" }}
              />
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.8)", fontSize: 13, width: "100%", outline: "none" }}
              />
              {error && <p style={{ color: "#fca5a5", fontSize: 12 }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={saveProfile} disabled={saving} style={{ flex: 1, background: "#ff6b35", border: "none", borderRadius: 8, padding: "7px", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "7px", color: "white", fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2>{user.name}</h2>
              <p>{user.phone || "No phone set"}</p>
              <p>{user.email}</p>
              <button
                onClick={() => setEditing(true)}
                style={{ marginTop: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "5px 14px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
              >
                ✏️ Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-num">{stats ? stats.completedOrders : "—"}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="stat-num">{stats ? `$${Number(stats.totalSpent).toFixed(0)}` : "—"}</span>
          <span className="stat-label">Spent</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="stat-num">{user.role === "vendor" ? "🏪" : "👤"}</span>
          <span className="stat-label">{user.role}</span>
        </div>
      </div>

      {PROFILE_SECTIONS.map(s => (
        <div key={s.title} className="profile-section">
          <p className="profile-section-title">{s.title}</p>
          <div className="profile-list">
            {s.items.map(item => (
              <button key={item.label} className="profile-item">
                <span className="profile-item-icon">{item.icon}</span>
                <span className="profile-item-label">{item.label}</span>
                <span className="profile-item-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="logout-btn" onClick={logout}>Sign Out</button>
      <div style={{ height: 20 }} />
    </div>
  );
}
