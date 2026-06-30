import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Outlined Figma Input Form Row ──
function Field({ label, value, onChange, type = "text", placeholder, disabled, suffix }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      {/* Figma Embedded Cutout Label */}
      <label style={{
        position: "absolute",
        left: 16,
        top: -8,
        background: "white",
        padding: "0 6px",
        fontSize: 12,
        fontWeight: 500,
        color: "#7a7065",
        zIndex: 2,
        pointerEvents: "none"
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          style={{
            width: "100%",
            height: 52,
            border: "1px solid #e8e4df",
            borderRadius: 16,
            padding: "0 16px",
            fontSize: 14,
            fontWeight: 600,
            color: disabled ? "#7a7065" : "#0f0f0f",
            background: disabled ? "#fafaf9" : "white",
            fontFamily: "DM Sans, sans-serif",
            outline: "none"
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

// ── Chevron Selection Row ──
function ListRow({ icon, label, onClick, badge }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        background: "none",
        border: "none",
        padding: "16px 0",
        cursor: "pointer",
        fontFamily: "DM Sans, sans-serif",
        borderBottom: "1px solid #fcfbfa"
      }}
    >
      <span style={{ marginRight: 12, fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 500, color: "#5c534c" }}>{label}</span>
      {badge && (
        <span style={{ fontSize: 11, background: "#fee2e2", color: "#e53935", padding: "3px 8px", borderRadius: 8, marginRight: 8, fontWeight: 600 }}>
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

  const [saving,         setSaving]    = useState(false);
  const [locating,       setLocating]  = useState(false);
  const [locationStatus, setLocSt]     = useState("");
  const [hardBlocked,    setHardBlocked] = useState(false);
  const [error,          setError]     = useState("");
  const [success,        setSuccess]   = useState(false);

  // Payment configuration states
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [payPhone, setPayPhone] = useState(user?.savedPaymentPhone || user?.phone || "");
  const [hasSavedCard, setHasSavedCard] = useState(user?.hasSavedCard || false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

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

  const savePaymentSettings = async (e) => {
    e.preventDefault();
    setUpdatingPayment(true);
    try {
      const { user: updated } = await apiRequest("/api/auth/me/update-payment", {
        method: "PATCH",
        body: { savedPaymentPhone: payPhone, hasSavedCard },
      });
      updateUser(updated);
      setShowPayPopup(false);
    } catch (e) {
      alert(e.message || "Failed to sync checkout wallets.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  return (
    <div style={{ background: "#fafaf9", minHeight: "100vh", paddingBottom: 40, fontFamily: "DM Sans, sans-serif" }}>
      
      {/* ── Top Header Banner with Burger Graphics Styling ── */}
      <div style={{ 
        background: `linear-gradient(180deg, #ff4d4d 0%, #e53935 100%)`, 
        height: 180, 
        position: "relative", 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        overflow: "hidden"
      }}>
        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
          <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Floating Profile Avatar */}
        <div style={{ position: "absolute", bottom: -45, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <div style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 24, 
            background: "#fff", 
            padding: 4, 
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ 
              width: "100%", 
              height: "100%", 
              borderRadius: 20, 
              background: "#ffebea", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 32, 
              fontWeight: 700, 
              color: "#e53935" 
            }}>
              {form.name ? form.name[0].toUpperCase() : "👤"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Content Area ── */}
      <div style={{ maxWidth: 450, margin: "60px auto 0", padding: "0 24px" }}>
        
        <div style={{ background: "white", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          
          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Your Name" />
          <Field label="Email" value={form.email} type="email" disabled />
          <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Address Line" />
          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="Phone" />
          <Field label="Password" value={form.password} type="password" disabled />

          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px 0", textAlign: "center" }}>{error}</p>}

          <div style={{ height: 1, background: "#f4f1ed", margin: "16px 0" }} />

          {/* Action List items */}
          <ListRow icon="💳" label="Payment Details" onClick={() => setShowPayPopup(true)} badge={hasSavedCard ? "Active" : null} />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />
        </div>

        {/* ── Figma Grid Floating Bottom Buttons ── */}
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          <button 
            onClick={save} 
            disabled={saving}
            style={{ 
              flex: 1.2, 
              height: 54, 
              background: "#362f2d", 
              color: "white", 
              border: "none", 
              borderRadius: 18, 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 6px 16px rgba(54, 47, 45, 0.15)"
            }}
          >
            {saving ? "Saving…" : "Edit Profile"}
            {!saving && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </button>

          <button 
            onClick={logout}
            style={{ 
              flex: 1, 
              height: 54, 
              background: "white", 
              color: "#e53935", 
              border: "2px solid #e53935", 
              borderRadius: 18, 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            Log out
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

      </div>

      {/* ── Inline Payment Popup Form Modal ── */}
      {showPayPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <form onSubmit={savePaymentSettings} style={{ background: "white", width: "100%", maxWidth: 380, borderRadius: 24, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>Payment Details</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: "#7a7065", lineHeight: 1.5 }}>Set default payment handles linked directly to your checkout system.</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#7a7065", marginBottom: 6 }}>Default Mobile Money Number</label>
              <input 
                type="tel" 
                style={{ width: "100%", height: 46, border: "1px solid #e8e4df", borderRadius: 12, padding: "0 12px", fontSize: 13, fontFamily: "DM Sans" }}
                value={payPhone} 
                onChange={e => setPayPhone(e.target.value)} 
                placeholder="e.g. 0712345678" 
              />
            </div>

            <div style={{ background: "#fafaf9", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, border: "1px solid #edebe8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, display: "block", color: "#362f2d" }}>Credit / Debit Card</span>
                  <span style={{ fontSize: 11, color: hasSavedCard ? "#16a34a" : "#7a7065" }}>{hasSavedCard ? "Linked via Stripe token" : "No saved card context"}</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={hasSavedCard} 
                onChange={e => setHasSavedCard(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#e53935", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={updatingPayment} style={{ flex: 1.2, height: 44, background: "#362f2d", color: "white", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {updatingPayment ? "Syncing…" : "Save Wallet"}
              </button>
              <button type="button" onClick={() => setShowPayPopup(false)} style={{ flex: 1, height: 44, background: "none", border: "1px solid #e8e4df", borderRadius: 12, fontSize: 13, color: "#7a7065", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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