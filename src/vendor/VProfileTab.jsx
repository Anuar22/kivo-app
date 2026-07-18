import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { fmt } from "../utils/currency.js";

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
        style: "mapbox://styles/mapbox/dark-v11", /* Optimized Mapbox style to dark format */
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
      <p style={{ fontSize: 12, color: "#a0a0a0", marginBottom: 6 }}>
        Drag the pin to fine-tune your exact location
      </p>
      <div
        ref={containerRef}
        style={{ height: 200, borderRadius: 12, overflow: "hidden", border: "1.5px solid #222222" }}
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
    <div className="form-group" style={{ position: "relative", marginBottom: "16px" }}>
      <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Search restaurant address</label>
      <input
        className="form-input"
        value={query}
        onChange={e => search(e.target.value)}
        placeholder="Start typing your address…"
        style={{ paddingRight: 32, width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", paddingLeft: "12px", boxSizing: "border-box", outline: "none" }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 12, top: "64%", transform: "translateY(-50%)", fontSize: 14 }}>⏳</span>
      )}
      {results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#121212", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 10, overflow: "hidden", border: "1px solid #222222", marginTop: 4,
        }}>
          {results.map(f => (
            <button
              key={f.id}
              onClick={() => pick(f)}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "11px 14px", fontSize: 13, color: "#ffffff", cursor: "pointer",
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)", borderBottom: "1px solid #1a1a1a",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}
            >
              <span style={{ flexShrink: 0 }}>📍</span>
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
          deliveryFee:  vendor.delivery_fee  != null ? String(vendor.delivery_fee)  : "2000",
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

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      showToast("⚠️ Geolocation not supported on this device");
      return;
    }

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
        deliveryFee:  parseFloat(form.deliveryFee) || 2000,
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
    <div className="vd-content" style={{ background: "#000000", minHeight: "40vh" }}>
      <div className="empty-orders" style={{ textAlign: "center", padding: "40px 0" }}><div className="emoji" style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div><p style={{ color: "#a0a0a0" }}>Loading profile…</p></div>
    </div>
  );

  const hasLocation = form.latitude != null && form.longitude != null;

  return (
    <div className="vd-content" style={{ marginTop: "12px" }}>

      {/* ── Status card ── */}
      <div className="stats-row" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div className="stat-card" style={{ flex: 1, background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
          <div className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</div>
          <div className="stat-value" style={{ color: form.isOpen ? "#22c55e" : "#ef4444", fontSize: "16px", fontWeight: "800", margin: "4px 0 2px" }}>
            {form.isOpen ? "🟢 Open" : "🔴 Closed"}
          </div>
          <div className="stat-sub">
            <button
              onClick={() => set("isOpen", !form.isOpen)}
              style={{ background: "none", border: "none", color: "#e53935", fontSize: "12px", fontWeight: "700", cursor: "pointer", padding: 0, fontFamily: "var(--font-body, 'DM Sans', sans-serif)" }}
            >
              Toggle Status
            </button>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1, background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
          <div className="stat-label" style={{ fontSize: "11px", fontWeight: "700", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location</div>
          <div className="stat-value" style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", margin: "4px 0 2px" }}>{hasLocation ? "📍 Set" : "❓ Not set"}</div>
          <div className="stat-sub" style={{ fontSize: "11px", color: "#666666", lineHeight: "1.3" }}>{hasLocation ? `${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : "Map placement pending"}</div>
        </div>
      </div>

      {/* ── Appearance hidden toggle context wrapper ── */}
      <div
        className="form-group"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#121212", border: "1px solid #1a1a1a",
          borderRadius: "16px", padding: "14px 16px", marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#ffffff" }}>
          {theme === "dark" ? "🌙" : "☀️"} Dark mode active
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
            background: theme === "dark" ? "#e53935" : "#333333",
            position: "relative", flexShrink: 0, transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute", top: "3px", left: theme === "dark" ? "23px" : "3px",
              width: "18px", height: "18px", borderRadius: "50%", background: "#ffffff",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      {/* ── Cover photo ── */}
      <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>Cover Photo</div>
      <p style={{ fontSize: "12px", color: "#666666", marginBottom: "12px", lineHeight: "1.5" }}>
        Shown on your restaurant card and storefront banner frame profiles.
      </p>
      {form.coverImageUrl ? (
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <img
            src={form.coverImageUrl} alt="Cover"
            style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "14px", border: "1px solid #222222" }}
          />
          <button
            type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
            style={{
              position: "absolute", bottom: "10px", right: "10px",
              background: "rgba(0,0,0,0.8)", border: "none", borderRadius: "10px",
              padding: "7px 14px", color: "white", fontSize: "12px", fontWeight: "700",
              cursor: uploadingCover ? "not-allowed" : "pointer", fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            }}
          >
            {uploadingCover ? "Uploading…" : "Change Photo"}
          </button>
        </div>
      ) : (
        <button
          type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
          style={{
            width: "100%", height: "100px", borderRadius: "14px", border: "1.5px dashed #222222",
            background: "#000000", color: "#666666", fontSize: "13px", fontWeight: "600",
            cursor: uploadingCover ? "not-allowed" : "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "24px"
          }}
        >
          {uploadingCover ? "🔄 Uploading…" : <>📷 Tap to upload a cover photo<span style={{ fontSize: "11px", fontWeight: "400", color: "#444444" }}>JPG or PNG, up to 5MB</span></>}
        </button>
      )}
      <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />

      {/* ── Restaurant info ── */}
      <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#ffffff", marginBottom: "16px" }}>Restaurant Info</div>

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Emoji Icon placeholder</label>
        <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", fontSize: "20px", textAlign: "center", outline: "none", boxSizing: "border-box" }} value={form.image} onChange={e => set("image", e.target.value)} />
      </div>

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Restaurant Name</label>
        <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mama's Kitchen" />
      </div>

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Description</label>
        <textarea
          value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="Tell customers what makes you special…"
          rows={3} 
          style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: "1px solid #222222", background: "#000000", color: "#ffffff", fontSize: "13px", fontFamily: "var(--font-body, 'DM Sans', sans-serif)", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: "1.4" }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: "18px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "8px" }}>Category</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
          {CATEGORIES.map(c => (
            <button
              key={c} type="button" onClick={() => set("category", c)}
              style={{
                padding: "6px 14px", borderRadius: "100px", border: "1px solid",
                borderColor: form.category === c ? "#e53935" : "#222222",
                background:  form.category === c ? "rgba(229, 57, 53, 0.12)" : "#121212",
                color:       form.category === c ? "#ffffff" : "#a0a0a0",
                fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-body, 'DM Sans', sans-serif)", transition: "0.15s"
              }}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="form-row" style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Delivery Fee (TZS)</label>
          <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} type="number" step="250" min="0" value={form.deliveryFee} onChange={e => set("deliveryFee", e.target.value)} />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Delivery Time</label>
          <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} value={form.deliveryTime} onChange={e => set("deliveryTime", e.target.value)} placeholder="20–35 min" />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: "16px", marginBottom: "24px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Tag / Badge</label>
        <input style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }} value={form.tag} onChange={e => set("tag", e.target.value)} placeholder="e.g. 🔥 Hot & Fresh" />
      </div>

      {/* ── Location section ── */}
      <div className="vd-section-title" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "800", color: "#ffffff", marginBottom: "6px", marginTop: "24px" }}>📍 Your Location</div>
      <p style={{ fontSize: "12px", color: "#666666", marginBottom: "14px", lineHeight: "1.5" }}>
        Helps customers discover you on the map interface.
      </p>

      {/* GPS capture trigger button */}
      <button
        onClick={useMyLocation}
        disabled={locating || hardBlocked}
        style={{
          width: "100%", padding: "13px", borderRadius: "12px",
          border: "1px solid #222222",
          background: (locating || hardBlocked) ? "#0a0a0a" : "#121212",
          color: (locating || hardBlocked) ? "#444444" : "#ffffff",
          fontWeight: "700", fontSize: "14px", cursor: (locating || hardBlocked) ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body, 'DM Sans', sans-serif)", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "8px", marginBottom: "16px", transition: "all 0.2s",
        }}
      >
        {hardBlocked
          ? <>🚫 Location blocked — allow in site settings</>
          : locating
            ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>🔄</span> Fetching GPS position…</>
            : <>📍 Use My Current Location</>
        }
      </button>

      {/* Mapbox address search component */}
      <AddressSearch onSelect={(lat, lng, addr) => {
        setForm(f => ({ ...f, latitude: lat, longitude: lng, address: addr }));
        showToast("📍 Address found!");
      }} />

      {/* Manual fallback input field */}
      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#e53935", marginBottom: "6px" }}>Address (or type manually)</label>
        <input
          className="form-input"
          style={{ width: "100%", height: "42px", background: "#000000", border: "1px solid #222222", borderRadius: "12px", color: "#ffffff", padding: "0 12px", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box" }}
          value={form.address}
          onChange={e => set("address", e.target.value)}
          placeholder="e.g. Sokoine Road, Arusha"
        />
      </div>

      {/* Mapbox interactive preview engine panel */}
      {hasLocation && (
        <MapPreview
          lat={form.latitude}
          lng={form.longitude}
          onMove={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
        />
      )}

      {/* Main Save action bar trigger */}
      <button 
        className="btn-save" 
        onClick={save} 
        disabled={saving} 
        style={{ width: "100%", height: "50px", background: "#e53935", color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", marginTop: "28px", boxShadow: "0 4px 14px rgba(229,57,53,0.25)" }}
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>

      <div style={{ height: 40 }} />
    </div>
  );
}