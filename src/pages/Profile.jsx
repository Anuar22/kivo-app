import { useState, useEffect } from "react";
import { useAccount } from "../context/AccountContext.jsx";
import { apiRequest } from "../api/index.js";
import SuccessModal from "../components/SuccessModal.jsx";

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

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

// Loads Google Maps JS (Places) once, only if a key is configured
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    if (!GOOGLE_KEY) { reject(new Error("no_key")); return; }
    const existing = document.querySelector("script[data-kivo-gmaps]");
    if (existing) { existing.addEventListener("load", () => resolve(window.google.maps)); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`;
    s.async = true;
    s.dataset.kivoGmaps = "1";
    s.onload  = () => resolve(window.google.maps);
    s.onerror = () => reject(new Error("Could not load Google Maps."));
    document.head.appendChild(s);
  });
}

// Reverse-geocodes lat/lng into a human readable address using Google,
// falling back to plain coordinates if no key is configured.
async function reverseGeocode(lat, lng) {
  if (!GOOGLE_KEY) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    return await new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) resolve(results[0].formatted_address);
        else resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      });
    });
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function Profile({ navigate }) {
  const { user, logout, updateUser } = useAccount();
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    password: "••••••••",
  });
  const [saving, setSaving]     = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [stats, setStats]       = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/me/stats").then(setStats).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── "Use my location" → fills the address field with a real place name ──
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const placeName = await reverseGeocode(latitude, longitude);
        setForm(f => ({ ...f, address: placeName }));
        setLocating(false);
      },
      (err) => {
        const msgs = {
          1: "Location permission denied. Please allow it in your browser/app settings.",
          2: "Could not detect your position. Try again or type your address.",
          3: "Location request timed out.",
        };
        setError(msgs[err.code] || "Could not get your location.");
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
      updateUser(updated);   // <-- persist the change into app-wide state
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
              disabled={locating}
              title="Use my current location"
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: locating ? "not-allowed" : "pointer",
                fontSize: 16, padding: 6, lineHeight: 1,
              }}
            >
              {locating ? "🔄" : "📍"}
            </button>
          }
        />

        <Field label="Phone number" value={form.phone} onChange={set("phone")} placeholder="+254 7xx xxx xxx" />
        <Field label="Password" value={form.password} type="password" disabled onChange={() => {}} />

        {error && <p className="pv2-error">{error}</p>}

        <div className="pv2-divider" />

        <ListRow icon="💳" label="Payment Details" onClick={() => navigate("cart")} />
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
