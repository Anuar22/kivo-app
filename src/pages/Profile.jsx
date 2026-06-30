import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Outlined Figma Input Field Component ──
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

// ── Chevron Action List Row ──
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

// ── Theme Toggle Row ──
function ThemeRow({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #fcfbfa" }}>
      <span style={{ marginRight: 12, fontSize: 16 }}>{isDark ? "🌙" : "☀️"}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontWeight: 500, color: "#5c534c" }}>Dark mode</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle dark mode"
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
          background: isDark ? "#e53935" : "#e8e4df",
          position: "relative", flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute", top: 3, left: isDark ? 21 : 3,
            width: 20, height: 20, borderRadius: "50%", background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

// ── Geocoding Engine Helper ──
async function reverseGeocode(lat, lng) {
  if (!MAPBOX_TOKEN) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const res  = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ── Main Page Export Component ──
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
  const [stats,          setStats]     = useState(null);

  // Payment popup state triggers
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [payPhone, setPayPhone] = useState(user?.savedPaymentPhone || user?.phone || "");
  const [hasSavedCard, setHasSavedCard] = useState(user?.hasSavedCard || false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocSt("❌ Geolocation isn't supported on this device.");
      return;
    }
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "denied") {
          setHardBlocked(true);
          setLocSt("❌ Location blocked. Update browser settings.");
          return;
        }
      } catch {}
    }

    setLocating(true);
    setHardBlocked(false);
    setLocSt("📡 Getting your location…");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocSt("🔄 Resolving address…");
        const placeName = await reverseGeocode(latitude, longitude);
        setForm(f => ({ ...f, address: placeName }));
        setLocSt("✅ Location captured!");
        setLocating(false);
        setTimeout(() => setLocSt(""), 3000);
      },
      (err) => {
        if (err.code === 1) {
          setHardBlocked(true);
          setLocSt("❌ Location blocked.");
        } else {
          setLocSt("❌ Timeout error capturing coordinates.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

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
    <div style={{ background: "#fafaf9", minHeight: "100vh", paddingBottom: 40, margin: 0, fontFamily: "DM Sans, sans-serif" }}>
      
      {/* ── Top Header Banner with Dynamic Gradient (As seen in Screenshot 2026-06-30 103955.png) ── */}
      <div style={{ 
        background: "linear-gradient(180deg, #ff4d4d 0%, #e53935 100%)", 
        height: 180, 
        position: "relative", 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        overflow: "visible",
        margin: 0,            // Kills left/right/top space
        paddingTop: 8,        // Gives icons a slight breathing room from the actual physical notch
      }}>
        {/* Navigation Row */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
          <button onClick={() => navigate("home")} style={{ background: "none", border: "none", cursor: "pointer" }} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer" }} aria-label="Settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Overlapping Floating Profile Avatar Frame */}
        <div style={{ position: "absolute", bottom: -45, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <div style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 24, 
            background: "#fff", 
            padding: 4, 
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)" 
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

      {/* ── Content Form Block Area ── */}
      <div style={{ maxWidth: 450, margin: "60px auto 0", padding: "0 24px" }}>
        
        <div style={{ background: "white", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 15px rgba(0,0,0,0.01)" }}>
          
          {/* Quick stats block */}
          {stats && (
            <div style={{ display: "flex", justifyContent: "space-around", background: "#fafaf9", padding: "12px 6px", borderRadius: 16, marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>{stats.completedOrders}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Orders</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>{fmt(stats.totalSpent)}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Spent</span>
              </div>
              <div style={{ width: 1, background: "#e8e4df" }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>{stats.activeOrders}</span>
                <span style={{ fontSize: 11, color: "#7a7065" }}>Active</span>
              </div>
            </div>
          )}

          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Your full name" />
          <Field label="Email" value={form.email} type="email" disabled />
          
          <Field 
            label="Delivery address" 
            value={form.address} 
            onChange={set("address")} 
            placeholder="Street, City" 
            suffix={
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating || hardBlocked}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: (locating || hardBlocked) ? "not-allowed" : "pointer",
                  fontSize: 16, padding: 6, opacity: hardBlocked ? 0.4 : 1
                }}
              >
                {locating ? "🔄" : "📍"}
              </button>
            }
          />

          {locationStatus && (
            <p style={{
              fontSize: 11, marginTop: -14, marginBottom: 14, paddingLeft: 4,
              color: locationStatus.startsWith("✅") ? "#22c55e" : locationStatus.startsWith("❌") ? "#ef4444" : "#7a7065",
            }}>
              {locationStatus}
            </p>
          )}

          <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="+255 7xx xxx xxx" />
          <Field label="Password" value={form.password} type="password" disabled />

          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px 0", textAlign: "center" }}>{error}</p>}

          <div style={{ height: 1, background: "#f4f1ed", margin: "16px 0" }} />

          {/* Settings Items */}
          <ThemeRow theme={theme} onToggle={toggleTheme} />
          <ListRow icon="💳" label="Payment Details" onClick={() => setShowPayPopup(true)} badge={hasSavedCard ? "Active" : null} />
          <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />
        </div>

        {/* ── Figma Floating Button Row (As seen in Screenshot 2026-06-30 103955.png) ── */}
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          <button 
            type="button"
            onClick={save} 
            disabled={saving}
            style={{ 
              flex: 1.2, height: 54, background: "#362f2d", color: "white", border: "none", 
              borderRadius: 18, fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
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
            type="button"
            onClick={logout}
            style={{ 
              flex: 1, height: 54, background: "white", color: "#e53935", border: "2px solid #e53935", 
              borderRadius: 18, fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
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

      {/* ── Built-in Payment Setup Overlay Modal ── */}
      {showPayPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <form onSubmit={savePaymentSettings} style={{ background: "white", width: "100%", maxWidth: 380, borderRadius: 24, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#362f2d" }}>Payment Details</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: "#7a7065", lineHeight: 1.5 }}>Configure your automated credentials for smooth application checkouts.</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#7a7065", marginBottom: 6 }}>Default Mobile Money Handle</label>
              <input 
                type="tel" 
                style={{ width: "100%", height: 46, border: "1px solid #e8e4df", borderRadius: 12, padding: "0 12px", fontSize: 13, fontFamily: "DM Sans", outline: "none" }}
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
                  <span style={{ fontSize: 11, color: hasSavedCard ? "#16a34a" : "#7a7065" }}>{hasSavedCard ? "Attached via secure Stripe Gateway" : "No linked bank cards"}</span>
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