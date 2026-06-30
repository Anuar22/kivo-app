import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

function Field({ label, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <label style={{
        position: "absolute", left: 16, top: -8, background: "white", padding: "0 6px",
        fontSize: 12, fontWeight: 500, color: "#7a7065", zIndex: 2, pointerEvents: "none"
      }}>
        {label}
      </label>
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
    </div>
  );
}

function ListRow({ icon, label, onClick }) {
  return (
    <button 
      type="button" onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", background: "none",
        border: "none", padding: "14px 0", cursor: "pointer", borderBottom: "1px solid #fcfbfa"
      }}
    >
      <span style={{ marginRight: 12, fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 500, color: "#5c534c" }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a7065" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export default function Profile({ navigate }) {
  const { user, logout, updateUser } = useAccount();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState(null);

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
    // Pulled up by (navbar height + safe-area-inset-top) so the white header
    // sits flush under the status bar with no gap above "My Profile".
    <div style={{
      background: "#fafaf9",
      minHeight: "100vh",
      margin: "calc(-1 * (var(--nav-h) + var(--sat))) 0 0",
      padding: 0,
      fontFamily: "DM Sans, sans-serif",
      boxSizing: "border-box",
    }}>

      {/* Top Header Row — padding-top absorbs the safe area instead of leaving a gap */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "calc(var(--sat) + 20px) 20px 10px 20px",
        background: "white", borderBottom: "1px solid #f4f1ed",
      }}>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#362f2d" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#362f2d" }}>My Profile</h2>
        <div style={{ width: 32 }} />
      </div>

      {/* Main Form content alignment */}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 16px" }}>

        {/* Simple Top Identity Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "#ffebea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#e53935" }}>
            {form.name ? form.name[0].toUpperCase() : "👤"}
          </div>
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>{form.name || "User"}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#7a7065" }}>{form.email}</p>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "20px 16px", boxShadow: "0 4px 15px rgba(0,0,0,0.01)" }}>
          {stats && (
            <div style={{ display: "flex", justifyContent: "space-around", background: "#fafaf9", padding: "10px 4px", borderRadius: 12, marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#362f2d" }}>{stats.completedOrders}</span>
                <span style={{ fontSize: 10, color: "#7a7065" }}>Orders</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#362f2d" }}>{fmt(stats.totalSpent)}</span>
                <span style={{ fontSize: 10, color: "#7a7065" }}>Spent</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#362f2d" }}>{stats.activeOrders}</span>
                <span style={{ fontSize: 10, color: "#7a7065" }}>Active</span>
              </div>
            </div>
          )}

          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Full Name" />
          <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Address Line" />
          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="Phone number" />

          {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: -8, marginBottom: 16 }}>{error}</p>}

          <div style={{ height: 1, background: "#f5f3f0", margin: "12px 0" }} />

          <ListRow icon="💳" label="Payment Details" onClick={() => navigate("cart")} />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />
        </div>

        {/* Form Action Controls */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button 
            type="button" onClick={save} disabled={saving}
            style={{ 
              flex: 1.2, height: 48, background: "#362f2d", color: "white", border: "none", 
              borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button 
            type="button" onClick={logout}
            style={{ 
              flex: 1, height: 48, background: "white", color: "#e53935", border: "2px solid #e53935", 
              borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer"
            }}
          >
            Log out
          </button>
        </div>

        <div style={{ height: 30 }} />
      </div>

      {success && (
        <SuccessModal
          title="Updated"
          message="Your profile has been updated successfully."
          buttonLabel="OK"
          onClose={() => setSuccess(false)}
        />
      )}
    </div>
  );
}
