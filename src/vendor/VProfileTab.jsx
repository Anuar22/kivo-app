import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { useTheme } from "../context/ThemeContext.jsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Load Mapbox GL JS + CSS once
function loadMapbox() {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) { resolve(window.mapboxgl); return; }
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    s.onload  = () => resolve(window.mapboxgl);
    s.onerror = () => reject(new Error("Could not load map."));
    document.head.appendChild(s);
  });
}

// ── Mini map preview with draggable Mapbox pin ───────────────────────────────
function MapPreview({ lat, lng, onMove }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !lat || !lng || !MAPBOX_TOKEN) return;
    let mounted = true;

    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current) return;

      // If map already initialised, just update position
      if (mapRef.current) {
        mapRef.current.setCenter([lng, lat]);
        markerRef.current?.setLngLat([lng, lat]);
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 16,
        scrollZoom: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const marker = new mapboxgl.Marker({ color: "#e53935", draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        onMove(pos.lat, pos.lng);
      });

      mapRef.current    = map;
      markerRef.current = marker;
    }).catch(() => {});

    return () => { mounted = false; };
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 12, color: "#7a7065", marginBottom: 6 }}>
        Drag the pin to fine-tune your exact location
      </p>
      <div
        ref={containerRef}
        style={{ height: 200, borderRadius: 12, overflow: "hidden", border: "1.5px solid #e8e4df" }}
      />
    </div>
  );
}

// ── Address search using Mapbox Geocoding API ─────────────────────────────────
function AddressSearch({ onSelect }) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const debounceRef = useRef(null);

  if (!MAPBOX_TOKEN) return null;

  const search = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=address,place,poi`
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const pick = (feature) => {
    const [lng, lat] = feature.center;
    onSelect(lat, lng, feature.place_name);
    setQuery(feature.place_name);
    setResults([]);
  };

  return (
    <div className="form-group" style={{ position: "relative" }}>
      <label className="form-label">Search restaurant address</label>
      <input
        className="form-input"
        value={query}
        onChange={e => search(e.target.value)}
        placeholder="Start typing your address…"
        style={{ paddingRight: 32 }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "calc(50% + 10px)", transform: "translateY(-50%)", fontSize: 14 }}>⏳</span>
      )}
      {results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "white", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          zIndex: 10, overflow: "hidden", border: "1px solid #e8e4df", marginTop: 2,
        }}>
          {results.map(f => (
            <button
              key={f.id}
              onClick={() => pick(f)}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "10px 12px", fontSize: 13, color: "#0f0f0f", cursor: "pointer",
                fontFamily: "DM Sans, sans-serif", borderBottom: "1px solid #f0ede9",
                display: "flex", alignItems: "flex-start", gap: 6,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
              <span style={{ lineHeight: 1.4 }}>{f.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main profile tab ──────────────────────────────────────────────────────────
const CATEGORIES = ["African", "Burgers", "Pizza", "Chicken", "Vegan", "Drinks", "Desserts", "Other"];

export default function VProfileTab({ showToast }) {
  const { theme, toggleTheme } = useTheme();
  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [locating,       setLocating]       = useState(false);
  const [hardBlocked,    setHardBlocked]    = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form,           setForm]           = useState(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    vendorsApi.myProfile()
      .then(({ vendor }) => {
        setProfile(vendor);
        setForm({
          name:         vendor.name         || "",
          category:     vendor.category     || "",
          description:  vendor.description  || "",
          deliveryFee:  vendor.delivery_fee  != null ? String(vendor.delivery_fee)  : "2.00",
          deliveryTime: vendor.delivery_time || "20–35 min",
          image:        vendor.image        || "🍽️",
          tag:          vendor.tag          || "",
          isOpen:       vendor.is_open      ?? true,
          address:      vendor.address      || "",
          latitude:     vendor.latitude     != null ? Number(vendor.latitude)  : null,
          longitude:    vendor.longitude    != null ? Number(vendor.longitude) : null,
          coverImageUrl: vendor.cover_image_url || "",
        });
      })
      .catch(() => showToast("⚠️ Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("⚠️ Image must be under 5MB"); return; }
    setUploadingCover(true);
    try {
      const { url, vendor } = await vendorsApi.uploadCoverPhoto(file);
      set("coverImageUrl", url);
      setProfile(vendor);
      showToast("📸 Cover photo updated!");
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // ── GPS location with hard-block detection ────────────────────────────────
  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      showToast("⚠️ Geolocation not supported on this device");
      return;
    }

    // Check if browser has permanently blocked before calling getCurrentPosition
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "denied") {
          setHardBlocked(true);
          showToast("⚠️ Location blocked. Go to browser Settings → Site permissions → Location and allow this site.");
          return;
        }
      } catch { /* Permissions API not supported — try anyway */ }
    }

    setLocating(true);
    setHardBlocked(false);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, latitude, longitude }));
        showToast("📍 Location captured!");
        setLocating(false);
      },
      err => {
        if (err.code === 1) {
          setHardBlocked(true);
          showToast("⚠️ Location blocked. Go to browser Settings → Site permissions → Location to allow access.");
        } else if (err.code === 2) {
          showToast("⚠️ Could not detect your position. Try again or search your address.");
        } else {
          showToast("⚠️ Location request timed out.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const save = async () => {
    if (!form.name.trim()) { showToast("⚠️ Restaurant name is required"); return; }
    setSaving(true);
    try {
      const { vendor } = await vendorsApi.updateProfile({
        name:         form.name.trim(),
        category:     form.category   || null,
        description:  form.description.trim() || null,
        deliveryFee:  parseFloat(form.deliveryFee) || 2,
        deliveryTime: form.deliveryTime.trim() || null,
        image:        form.image.trim() || null,
        tag:          form.tag.trim()  || null,
        isOpen:       form.isOpen,
        address:      form.address.trim() || null,
        latitude:     form.latitude,
        longitude:    form.longitude,
      });
      setProfile(vendor);
      showToast("✅ Profile saved!");
    } catch (e) {
      showToast("⚠️ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return (
    <div className="vd-content">
      <div className="empty-orders"><div className="emoji">⏳</div><p>Loading profile…</p></div>
    </div>
  );

  const hasLocation = form.latitude != null && form.longitude != null;

  return (
    <div className="vd-content">

      {/* ── Status card ── */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ color: form.isOpen ? "#22c55e" : "#ef4444", fontSize: 16 }}>
            {form.isOpen ? "🟢 Open" : "🔴 Closed"}
          </div>
          <div className="stat-sub">
            <button
              onClick={() => set("isOpen", !form.isOpen)}
              style={{ background: "none", border: "none", color: "#e53935", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "DM Sans, sans-serif" }}
            >
              Toggle
            </button>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-label">Location</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{hasLocation ? "📍 Set" : "❓ Not set"}</div>
          <div className="stat-sub">{hasLocation ? `${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : "Customers can't find you on map"}</div>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div
        className="form-group"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          {theme === "dark" ? "🌙" : "☀️"} Dark mode
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
            background: theme === "dark" ? "var(--orange)" : "var(--border)",
            position: "relative", flexShrink: 0, transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute", top: 3, left: theme === "dark" ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      {/* ── Cover photo ── */}
      <div className="vd-section-title" style={{ marginBottom: 12 }}>Cover Photo</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>
        Shown on your restaurant card and storefront. A real photo performs much better than the emoji icon.
      </p>
      {form.coverImageUrl ? (
        <div style={{ position: "relative", marginBottom: 20 }}>
          <img
            src={form.coverImageUrl} alt="Cover"
            style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 14, border: "1px solid var(--border)" }}
          />
          <button
            type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
            style={{
              position: "absolute", bottom: 10, right: 10,
              background: "rgba(15,15,15,0.75)", border: "none", borderRadius: 10,
              padding: "7px 12px", color: "white", fontSize: 12, fontWeight: 600,
              cursor: uploadingCover ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif",
            }}
          >
            {uploadingCover ? "Uploading…" : "Change photo"}
          </button>
        </div>
      ) : (
        <button
          type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
          style={{
            width: "100%", height: 120, borderRadius: 14, border: "1.5px dashed var(--border)",
            background: "var(--bg)", color: "var(--muted)", fontSize: 13, fontWeight: 600,
            cursor: uploadingCover ? "not-allowed" : "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {uploadingCover ? "🔄 Uploading…" : <>📷 Tap to upload a cover photo<span style={{ fontSize: 11, fontWeight: 400 }}>JPG or PNG, up to 5MB</span></>}
        </button>
      )}
      <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />

      {/* ── Restaurant info ── */}
      <div className="vd-section-title" style={{ marginBottom: 12 }}>Restaurant Info</div>

      <div className="form-group">
        <label className="form-label">Emoji / Icon</label>
        <input className="form-input" value={form.image} onChange={e => set("image", e.target.value)} style={{ fontSize: 22, textAlign: "center" }} />
      </div>

      <div className="form-group">
        <label className="form-label">Restaurant Name</label>
        <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mama's Kitchen" />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input" value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="Tell customers what makes you special…"
          rows={3} style={{ resize: "none", fontFamily: "DM Sans, sans-serif" }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {CATEGORIES.map(c => (
            <button
              key={c} onClick={() => set("category", c)}
              style={{
                padding: "6px 14px", borderRadius: 100, border: "1.5px solid",
                borderColor: form.category === c ? "#e53935" : "#e8e4df",
                background:  form.category === c ? "#fff1ec" : "#fff",
                color:       form.category === c ? "#e53935" : "#7a7065",
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Delivery Fee ($)</label>
          <input className="form-input" type="number" step="0.50" min="0" value={form.deliveryFee} onChange={e => set("deliveryFee", e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Delivery Time</label>
          <input className="form-input" value={form.deliveryTime} onChange={e => set("deliveryTime", e.target.value)} placeholder="20–35 min" />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Tag / Badge</label>
        <input className="form-input" value={form.tag} onChange={e => set("tag", e.target.value)} placeholder="e.g. 🔥 Hot & Fresh" />
      </div>

      {/* ── Location section ── */}
      <div className="vd-section-title" style={{ marginTop: 24, marginBottom: 12 }}>📍 Your Location</div>
      <p style={{ fontSize: 13, color: "#7a7065", marginBottom: 14, lineHeight: 1.6 }}>
        Your location helps customers discover you on the map and see accurate distances.
        Use the button below if you're at your restaurant, or search your address.
      </p>

      {/* GPS button */}
      <button
        onClick={useMyLocation}
        disabled={locating || hardBlocked}
        style={{
          width: "100%", padding: "13px", borderRadius: 12,
          border: "1.5px solid #e8e4df",
          background: (locating || hardBlocked) ? "#f7f5f2" : "#fff",
          color: (locating || hardBlocked) ? "#b0a89f" : "#0f0f0f",
          fontWeight: 700, fontSize: 14, cursor: (locating || hardBlocked) ? "not-allowed" : "pointer",
          fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, marginBottom: 16, transition: "all 0.2s",
        }}
      >
        {hardBlocked
          ? <>🚫 Location blocked — allow in browser settings</>
          : locating
            ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>🔄</span> Getting your location…</>
            : <>📍 Use My Current Location</>
        }
      </button>

      {/* Mapbox address search */}
      <AddressSearch onSelect={(lat, lng, addr) => {
        setForm(f => ({ ...f, latitude: lat, longitude: lng, address: addr }));
        showToast("📍 Address found!");
      }} />

      {/* Manual address text fallback */}
      <div className="form-group">
        <label className="form-label">Address (or type manually)</label>
        <input
          className="form-input"
          value={form.address}
          onChange={e => set("address", e.target.value)}
          placeholder="e.g. Sokoine Road, Arusha"
        />
      </div>

      {/* Mapbox map preview with draggable pin */}
      {hasLocation && (
        <MapPreview
          lat={form.latitude}
          lng={form.longitude}
          onMove={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
        />
      )}

      <button className="btn-save" onClick={save} disabled={saving} style={{ marginTop: 24 }}>
        {saving ? "Saving…" : "Save Profile"}
      </button>

      <div style={{ height: 40 }} />
    </div>
  );
}
