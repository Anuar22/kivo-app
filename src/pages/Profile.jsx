import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="pv2-field">
      <label className="pv2-label">{label}</label>
      <input
        className="pv2-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}

function ListRow({ icon, label, onClick }) {
  return (
    <button className="pv2-row" onClick={onClick}>
      <span className="pv2-row-icon">{icon}</span>
      <span className="pv2-row-label">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export default function Profile({ navigate }) {
  const { user, logout } = useAccount();
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    password: "••••••••",
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [stats, setStats]     = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/auth/me/update", {
        method: "PATCH",
        body: { name: form.name, phone: form.phone, address: form.address },
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-v2">
      {/* ── Header banner ── */}
      <div className="pv2-banner">
        <button className="pv2-back" onClick={() => navigate("home")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="pv2-banner-title">My Profile</span>
        <div className="pv2-avatar-wrap">
          <div className="pv2-avatar">{form.name ? form.name[0].toUpperCase() : "👤"}</div>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="pv2-card">
        {/* Quick stats */}
        {stats && (
          <div className="pv2-stats">
            <div className="pv2-stat">
              <span className="pv2-stat-num">{stats.completedOrders}</span>
              <span className="pv2-stat-label">Orders</span>
            </div>
            <div className="pv2-stat-divider" />
            <div className="pv2-stat">
              <span className="pv2-stat-num">${Number(stats.totalSpent).toFixed(0)}</span>
              <span className="pv2-stat-label">Spent</span>
            </div>
            <div className="pv2-stat-divider" />
            <div className="pv2-stat">
              <span className="pv2-stat-num">{stats.activeOrders}</span>
              <span className="pv2-stat-label">Active</span>
            </div>
          </div>
        )}

        <Field label="Name" value={form.name} onChange={set("name")} placeholder="Your full name" />
        <Field label="Email" value={form.email} type="email" onChange={() => {}} />
        <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Street, City" />
        <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="+254 7xx xxx xxx" />
        <Field label="Password" value={form.password} type="password" onChange={() => {}} />

        {error && <p className="pv2-error">{error}</p>}

        <div className="pv2-divider" />

        <ListRow icon="💳" label="Payment Details" onClick={() => navigate("cart")} />
        <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />

        <div className="pv2-actions">
          <button className="pv2-edit-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : (
              <>
                Edit Profile
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ marginLeft: 6 }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </>
            )}
          </button>
          <button className="pv2-logout-btn" onClick={logout}>
            Log out
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5" style={{ marginLeft: 6 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {success && (
        <SuccessModal
          title="Success!"
          message="Your profile has been updated successfully."
          buttonLabel="Go Back"
          onClose={() => setSuccess(false)}
        />
      )}
    </div>
  );
}
