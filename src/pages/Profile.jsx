import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function Field({ label, value, onChange, type = "text", placeholder, disabled, suffix }) {
  return (
    <div className="pv2-field">
      <label className="pv2-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="pv2-input"
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
    <button className="pv2-row" onClick={onClick} type="button">
      <span className="pv2-row-icon">{icon}</span>
      <span className="pv2-row-label">{label}</span>
      {badge && (
        <span style={{ fontSize: 11, background: "#f1eee9", color: "#7a7065", padding: "2px 8px", borderRadius: 8, marginRight: 6, fontWeight: 600 }}>
          {badge}
        </span>
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

function ThemeRow({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <div className="pv2-row" style={{ cursor: "default" }}>
      <span className="pv2-row-icon">{isDark ? "🌙" : "☀️"}</span>
      <span className="pv2-row-label">Dark mode</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle dark mode"
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
          background: isDark ? "var(--orange)" : "var(--line)",
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

  // Secure payment profile update routine
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
      alert(e.message || "Could not update default accounts.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  return (
    <div className="profile-v2" style={{ background: "#fafaf9", minHeight: "100vh" }}>
      
      {/* ── Fixed Highly-Visible Red Header block ── */}
      <div className="pv2-banner" style={{ background: "#e53935", padding: "40px 20px 30px", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, display: "block", position: "relative" }}>
        <button className="pv2-back" onClick={() => navigate("home")} style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.15)", borderRadius: "50%", p: 4, display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <div className="pv2-avatar-wrap" style={{ margin: 0 }}>
            <div className="pv2-avatar" style={{ border: "2px solid white", background: "rgba(255,255,255,0.25)", color: "white", fontSize: 24 }}>
              {form.name ? form.name[0].toUpperCase() : "👤"}
            </div>
          </div>
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 700 }}>{form.name || "My Account"}</h2>
            <p style={{ margin: "2px 0 0", color: "white", opacity: 0.85, fontSize: 13 }}>{form.email}</p>
          </div>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="pv2-card" style={{ marginTop: -15, position: "relative", zIndex: 2 }}>
        {stats && (
          <div className="pv2-stats">
            <div className="pv2-stat">
              <span className="pv2-stat-num">{stats.completedOrders}</span>
              <span className="pv2-stat-label">Orders</span>
            </div>
            <div className="pv2-stat-divider" />
            <div className="pv2-stat">
              <span className="pv2-stat-num">{fmt(stats.totalSpent)}</span>
              <span className="pv2-stat-label">Spent</span>
            </div>
            <div className="pv2-stat-divider" />
            <div className="pv2-stat">
              <span className="pv2-stat-num">{stats.activeOrders}</span>
              <span className="pv2-stat-label">Active</span>
            </div>
          </div>
        )}

        <Field label="Name"  value={form.name}  onChange={set("name")}  placeholder="Your full name" />
        <Field label="Email" value={form.email} type="email" disabled onChange={() => {}} />

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
              title={hardBlocked ? "Location blocked" : "Use current location"}
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: (locating || hardBlocked) ? "not-allowed" : "pointer",
                fontSize: 16, padding: 6, opacity: hardBlocked ? 0.4 : 1,
              }}
            >
              {locating ? "🔄" : "📍"}
            </button>
          }
        />

        {locationStatus && (
          <p style={{
            fontSize: 12, marginTop: -8, marginBottom: 12,
            color: locationStatus.startsWith("✅") ? "#22c55e" : locationStatus.startsWith("❌") ? "#ef4444" : "#7a7065",
          }}>
            {locationStatus}
          </p>
        )}

        <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="+255 7xx xxx xxx" />
        <Field label="Password"     value={form.password} type="password" disabled onChange={() => {}} />

        {error && <p className="pv2-error">{error}</p>}

        <div className="pv2-divider" />

        <ThemeRow theme={theme} onToggle={toggleTheme} />
        
        {/* Opens Popup Form modal directly without loading external paths */}
        <ListRow 
          icon="💳" 
          label="Payment Details" 
          onClick={() => setShowPayPopup(true)} 
          badge={hasSavedCard ? "Card + Mobile" : payPhone ? "Mobile Money" : "None"}
        />
        <ListRow icon="🧾" label="Order history" onClick={() => navigate("orders")} />

        <div className="pv2-actions">
          <button className="pv2-edit-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : (
              <>
                Save Changes
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ marginLeft: 6 }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </>
            )}
          </button>
          <button className="pv2-logout-btn" onClick={logout} type="button">
            Log out
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5" style={{ marginLeft: 6 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Built-in Popup Form Modal overlay ── */}
      {showPayPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20, fontFamily: "DM Sans, sans-serif" }}>
          <form onSubmit={savePaymentSettings} style={{ background: "white", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700 }}>Payment Details</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 12, color: "#7a7065", lineHeight: 1.4 }}>Configure your accounts for faster transactions at checkout.</p>
            
            {/* Mobile Money configuration */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#7a7065", marginBottom: 6 }}>Default Mobile Money Phone</label>
              <input 
                type="tel" 
                className="pv2-input" 
                style={{ width: "100%" }}
                value={payPhone} 
                onChange={e => setPayPhone(e.target.value)} 
                placeholder="e.g. 0712345678" 
              />
            </div>

            {/* Simulated Secure Credit Card Integration */}
            <div style={{ background: "#f7f5f2", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, display: "block" }}>Credit / Debit Card</span>
                  <span style={{ fontSize: 11, color: hasSavedCard ? "#16a34a" : "#7a7065" }}>{hasSavedCard ? "Linked securely via Stripe" : "No card attached"}</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={hasSavedCard} 
                onChange={e => setHasSavedCard(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#e53935", cursor: "pointer" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={updatingPayment} style={{ flex: 1, background: "#0f0f0f", color: "white", border: "none", padding: 12, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {updatingPayment ? "Saving…" : "Save Wallet"}
              </button>
              <button type="button" onClick={() => setShowPayPopup(false)} style={{ background: "none", border: "1.5px solid #e8e4df", padding: "12px 16px", borderRadius: 10, fontSize: 13, color: "#7a7065", cursor: "pointer" }}>
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