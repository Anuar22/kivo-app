import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx"; 
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

// Updated Field component to accept darkMode state
function Field({ label, value, onChange, type = "text", placeholder, disabled, darkMode }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <label style={{
        position: "absolute", left: 16, top: -8, 
        background: darkMode ? "#1e1e1e" : "white", // Adaptive label background
        padding: "0 6px",
        fontSize: 12, fontWeight: 500, 
        color: darkMode ? "#a3978c" : "#7a7065", 
        zIndex: 2, pointerEvents: "none"
      }}>
        {label}
      </label>
      <input
        style={{
          width: "100%", height: 50, 
          border: darkMode ? "1px solid #333230" : "1px solid #e8e4df", 
          borderRadius: 14,
          padding: "0 16px", fontSize: 14, fontWeight: 600,
          color: disabled ? (darkMode ? "#a3978c" : "#7a7065") : (darkMode ? "#f5f5f5" : "#0f0f0f"),
          background: disabled ? (darkMode ? "#181817" : "#fafaf9") : (darkMode ? "#1e1e1e" : "white"),
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

// Updated ListRow component to accept darkMode state
function ListRow({ icon, label, onClick, badge, rightElement, darkMode }) {
  return (
    <div 
      style={{
        width: "100%", display: "flex", alignItems: "center", background: "none",
        border: "none", padding: "14px 0", 
        borderBottom: darkMode ? "1px solid #262524" : "1px solid #fcfbfa"
      }}
    >
      <span style={{ marginRight: 12, fontSize: 16 }}>{icon}</span>
      <span style={{ 
        flex: 1, textAlign: "left", fontSize: 14, fontWeight: 500, 
        color: darkMode ? "#cbc2ba" : "#5c534c" 
      }}>{label}</span>
      {badge && (
        <span style={{ fontSize: 11, background: "#fee2e2", color: "#e53935", padding: "2px 8px", borderRadius: 8, marginRight: 8, fontWeight: 600 }}>
          {badge}
        </span>
      )}
      {rightElement ? rightElement : (
        <button type="button" onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#a3978c" : "#7a7065"} strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default function Profile({ navigate }) {
  const { user, logout, updateUser } = useAccount();
  const { darkMode, toggleTheme } = useTheme(); 
  
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
      alert(e.message || "Failed to update wallet parameters.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  return (
    <div style={{
      background: darkMode ? "#121212" : "#fafaf9", // Global page background
      minHeight: "100vh",
      margin: "calc(-1 * (var(--nav-h) + var(--sat))) 0 0",
      padding: 0,
      fontFamily: "DM Sans, sans-serif",
      boxSizing: "border-box",
      transition: "background 0.2s ease-in-out"
    }}>

      {/* Top Header Row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "calc(var(--sat) + 20px) 20px 10px 20px",
        background: darkMode ? "#1e1e1e" : "white", 
        borderBottom: darkMode ? "1px solid #292827" : "1px solid #f4f1ed",
      }}>
        <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#f5f5f5" : "#362f2d"} strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>My Profile</h2>
        <div style={{ width: 32 }} />
      </div>

      {/* Main Form content alignment */}
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 16px" }}>

        {/* Top Identity Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ 
            width: 54, height: 54, borderRadius: 14, 
            background: darkMode ? "#2c1a1a" : "#ffebea", 
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#e53935" 
          }}>
            {form.name ? form.name[0].toUpperCase() : "👤"}
          </div>
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 16, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>{form.name || "User"}</h3>
            <p style={{ margin: 0, fontSize: 12, color: darkMode ? "#a3978c" : "#7a7065" }}>{form.email}</p>
          </div>
        </div>

        {/* Central Settings Card Container */}
        <div style={{ 
          background: darkMode ? "#1e1e1e" : "white", 
          borderRadius: 20, padding: "20px 16px", 
          boxShadow: darkMode ? "none" : "0 4px 15px rgba(0,0,0,0.01)" 
        }}>
          {stats && (
            <div style={{ 
              display: "flex", justifyContent: "space-around", 
              background: darkMode ? "#181817" : "#fafaf9", 
              padding: "10px 4px", borderRadius: 12, marginBottom: 20 
            }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>{stats.completedOrders}</span>
                <span style={{ fontSize: 10, color: darkMode ? "#a3978c" : "#7a7065" }}>Orders</span>
              </div>
              <div style={{ width: 1, background: darkMode ? "#2d2c2a" : "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>{fmt(stats.totalSpent)}</span>
                <span style={{ fontSize: 10, color: darkMode ? "#a3978c" : "#7a7065" }}>Spent</span>
              </div>
              <div style={{ width: 1, background: darkMode ? "#2d2c2a" : "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>{stats.activeOrders}</span>
                <span style={{ fontSize: 10, color: darkMode ? "#a3978c" : "#7a7065" }}>Active</span>
              </div>
            </div>
          )}

          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Full Name" darkMode={darkMode} />
          <Field label="Delivery address" value={form.address} onChange={set("address")} placeholder="Address Line" darkMode={darkMode} />
          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="Phone number" darkMode={darkMode} />

          {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: -8, marginBottom: 16 }}>{error}</p>}

          <div style={{ height: 1, background: darkMode ? "#2d2c2a" : "#f5f3f0", margin: "12px 0" }} />

          {/* Theme Toggle Option */}
          <ListRow 
            icon={darkMode ? "🌙" : "☀️"} 
            label="Dark Mode" 
            darkMode={darkMode}
            rightElement={
              <input 
                type="checkbox" 
                checked={darkMode} 
                onChange={toggleTheme}
                style={{ width: 18, height: 18, accentColor: "#e53935", cursor: "pointer" }}
              />
            }
          />

          <ListRow 
            icon="💳" 
            label="Payment Details" 
            onClick={() => setShowPayPopup(true)} 
            badge={hasSavedCard ? "Active" : null} 
            darkMode={darkMode}
          />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} darkMode={darkMode} />
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button 
            type="button" onClick={save} disabled={saving}
            style={{ 
              flex: 1.2, height: 48, 
              background: darkMode ? "#e53935" : "#362f2d", // High contrast button color change
              color: "white", border: "none", 
              borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button 
            type="button" onClick={logout}
            style={{ 
              flex: 1, height: 48, 
              background: darkMode ? "#121212" : "white", 
              color: "#e53935", border: "2px solid #e53935", 
              borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer"
            }}
          >
            Log out
          </button>
        </div>

        <div style={{ height: 30 }} />
      </div>

      {/* ── HIGH OVERLAY POPUP FORM MODAL ── */}
      {showPayPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <form onSubmit={savePaymentSettings} style={{ 
            background: darkMode ? "#1e1e1e" : "white", 
            width: "100%", maxWidth: 360, borderRadius: 20, padding: 24, 
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)", boxSizing: "border-box" 
          }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>Payment Details</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: darkMode ? "#a3978c" : "#7a7065", lineHeight: 1.4 }}>Set standard parameters for checkout operations.</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: darkMode ? "#a3978c" : "#7a7065", marginBottom: 6 }}>Default Mobile Money Number</label>
              <input 
                type="tel" 
                style={{ 
                  width: "100%", height: 44, 
                  border: darkMode ? "1px solid #333230" : "1px solid #e8e4df", 
                  borderRadius: 12, padding: "0 12px", fontSize: 13, boxSizing: "border-box", outline: "none",
                  background: darkMode ? "#121212" : "white",
                  color: darkMode ? "#f5f5f5" : "#0f0f0f"
                }}
                value={payPhone} 
                onChange={e => setPayPhone(e.target.value)} 
                placeholder="e.g. 0712345678" 
              />
            </div>

            <div style={{ 
              background: darkMode ? "#181817" : "#fafaf9", 
              borderRadius: 12, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, 
              border: darkMode ? "1px solid #2d2c2a" : "1px solid #edebe8" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>💳</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, display: "block", color: darkMode ? "#f5f5f5" : "#362f2d" }}>Credit / Debit Card</span>
                  <span style={{ fontSize: 11, color: hasSavedCard ? "#16a34a" : (darkMode ? "#a3978c" : "#7a7065") }}>{hasSavedCard ? "Token linked securely" : "No saved cards"}</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={hasSavedCard} 
                onChange={e => setHasSavedCard(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#e53935", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={updatingPayment} style={{ flex: 1.2, height: 42, background: darkMode ? "#e53935" : "#362f2d", color: "white", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {updatingPayment ? "Saving…" : "Save Wallet"}
              </button>
              <button type="button" onClick={() => setShowPayPopup(false)} style={{ flex: 1, height: 42, background: "none", border: darkMode ? "1px solid #333230" : "1px solid #e8e4df", borderRadius: 12, fontSize: 13, color: darkMode ? "#a3978c" : "#7a7065", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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