import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";

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

// Reverse-geocode lat/lng → readable address using Mapbox,
// falling back to plain coordinates if no token is configured.
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
    name:    user.name    || "",
    email:   user.email   || "",
    phone:   user.phone   || "",
    address: user.address || "",
    password: "••••••••",
  });
  const [saving,         setSaving]    = useState(false);
  const [locating,       setLocating]  = useState(false);
  const [locationStatus, setLocSt]     = useState("");
  const [hardBlocked,    setHardBlocked] = useState(false);
  const [error,          setError]     = useState("");
  const [success,        setSuccess]   = useState(false);
  const [stats,          setStats]     = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── "Use my location" ──────────────────────────────────────────────────────
  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocSt("❌ Geolocation isn't supported on this device.");
      return;
    }

    // Check if browser has permanently blocked location before calling
    // getCurrentPosition — if blocked, it would silently error with no popup.
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "denied") {
          setHardBlocked(true);
          setLocSt("❌ Location blocked in browser settings. Go to Settings → Site permissions → Location → allow this site, then refresh.");
          return;
        }
      } catch { /* Permissions API not supported — try anyway */ }
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
          // PERMISSION_DENIED — browser-level block
          setHardBlocked(true);
          setLocSt("❌ Location blocked. Go to browser Settings → Site permissions → Location, allow this site, then refresh.");
        } else if (err.code === 2) {
          setLocSt("❌ Could not detect your position. Try again or type your address.");
        } else {
          setLocSt("❌ Location request timed out. Try again.");
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
              title={hardBlocked ? "Location blocked — check browser settings" : "Use my current location"}
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: (locating || hardBlocked) ? "not-allowed" : "pointer",
                fontSize: 16, padding: 6, lineHeight: 1,
                opacity: hardBlocked ? 0.4 : 1,
              }}
            >
              {locating ? "🔄" : "📍"}
            </button>
          }
        />

        {/* Location status / error message */}
        {locationStatus && (
          <p style={{
            fontSize: 12, lineHeight: 1.5, marginTop: -8, marginBottom: 12,
            color: locationStatus.startsWith("✅") ? "#22c55e"
                 : locationStatus.startsWith("❌") ? "#ef4444"
                 : "#7a7065",
          }}>
            {locationStatus}
          </p>
        )}

        <Field label="Phone number" value={form.phone}    onChange={set("phone")}    placeholder="+255 7xx xxx xxx" />
        <Field label="Password"     value={form.password} type="password" disabled onChange={() => {}} />

        {error && <p className="pv2-error">{error}</p>}

        <div className="pv2-divider" />

        <ThemeRow theme={theme} onToggle={toggleTheme} />
        <ListRow icon="💳" label="Payment Details"  onClick={() => navigate("cart")}   />
        <ListRow icon="🧾" label="Order history"    onClick={() => navigate("orders")} />

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
