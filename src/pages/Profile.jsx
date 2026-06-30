import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function Field({ label, value, onChange, type = "text", placeholder, disabled, suffix }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <label style={{
        position: "absolute", left: 16, top: -8, background: "white", padding: "0 6px",
        fontSize: 12, fontWeight: 500, color: "#7a7065", zIndex: 2, pointerEvents: "none"
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          style={{
            width: "100%", height: 50, border: "1px solid #e8e4df", borderRadius: 14,
            padding: "0 16px", fontSize: 14, fontWeight: 600,
            color: disabled ? "#7a7065" : "#0f0f0f",
            background: disabled ? "#fafaf9" : "white",
            outline: "none", boxSizing: "border-box"
          }}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
        />
        {suffix}
      </div>
    </div>
  );
}

function ListRow({ icon, label, onClick, badge }) {
  return (
    <button 
      type="button" onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", background: "none",
        border: "none", padding: "14px 0", cursor: "pointer", borderBottom: "1px solid #faf8h6"
      }}
    >
      <span style={{ marginRight: 12, fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 500, color: "#5c534c" }}>{label}</span>
      {badge && (
        <span style={{ fontSize: 11, background: "#fee2e2", color: "#e53935", padding: "2px 8px", borderRadius: 8, marginRight: 8, fontWeight: 600 }}>
          {badge}
        </span>
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a7065" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export default function Profile({ navigate }) {
  const { user, logout, updateUser } = useAccount();
  const { theme, toggleTheme } = useTheme();
  
  const [form, setForm] = useState({
    name:     user?.name     || "",
    email:    user?.email    || "",
    phone:    user?.phone    || "",
    address:  user?.address  || "",
    password: "••••••••",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState(null);
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [payPhone, setPayPhone] = useState(user?.savedPaymentPhone || user?.phone || "");
  const [hasSavedCard, setHasSavedCard] = useState(user?.hasSavedCard || false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await apiRequest("/api/auth/me/update", {
        method: "PATCH",
        body: { name: form.name, phone: form.phone, address: form.address },
      });
      updateUser(updated);
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", padding: "24px 20px 100px", fontFamily: "DM Sans, sans-serif", boxSizing: "border-box" }}>
      
      {/* ── Minimalist Top Navigation Header Bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#362f2d" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#362f2d" }}>My Profile</h2>
        <div style={{ width: 24 }} /> {/* Balancing spacer */}
      </div>

      {/* ── Flat Clean Identity Card ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "0 4px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#ffebea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#e53935" }}>
          {form.name ? form.name[0].toUpperCase() : "👤"}
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700, color: "#362f2d" }}>{form.name || "User Profile"}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#7a7065" }}>{form.email}</p>
        </div>
      </div>

      {/* ── Form Inputs Container ── */}
      <div style={{ maxWidth: 450, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          
          {stats && (
            <div style={{ display: "flex", justifyContent: "space-around", background: "#fafaf9", padding: "12px 6px", borderRadius: 16, marginBottom: 24 }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#362f2d" }}>{stats.completedOrders}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Orders</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#362f2d" }}>{fmt(stats.totalSpent)}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Spent</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#362f2d" }}>{stats.activeOrders}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Active</span>
              </div>
            </div>
          )}

          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Your name" />
          <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Address location" />
          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="Phone contact" />

          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px 0", textAlign: "center" }}>{error}</p>}

          <div style={{ height: 1, background: "#f5f3f0", margin: "16px 0" }} />

          <ListRow icon="💳" label="Payment Details" onClick={() => setShowPayPopup(true)} badge={hasSavedCard ? "Active" : null} />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />
        </div>

        {/* ── Bottom Grid Buttons ── */}
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          <button 
            type="button" onClick={save} disabled={saving}
            style={{ 
              flex: 1.2, height: 50, background: "#362f2d", color: "white", border: "none", 
              borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          <button 
            type="button" onClick={logout}
            style={{ 
              flex: 1, height: 50, background: "white", color: "#e53935", border: "2px solid #e53935", 
              borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            Log out
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