import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Load Mapbox once ──────────────────────────────────────────────────────────
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
    s.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(s);
  });
}

// ── Customer location hook ────────────────────────────────────────────────────
function useCustomerLocation() {
  const [coords, setCoords] = useState(() => {
    try { const s = sessionStorage.getItem("kivo_coords"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [denied,      setDenied]      = useState(false);
  const [hardBlocked, setHardBlocked] = useState(false);
  const [asking,      setAsking]      = useState(false);

  const request = () => {
    if (!navigator.geolocation || asking) return;
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then(result => {
        if (result.state === "denied") { setHardBlocked(true); setDenied(true); return; }
        doRequest();
      }).catch(() => doRequest());
    } else { doRequest(); }
  };

  const doRequest = () => {
    setAsking(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sessionStorage.setItem("kivo_coords", JSON.stringify(c));
        setCoords(c); setAsking(false); setDenied(false); setHardBlocked(false);
      },
      err => {
        if (err.code === 1) setHardBlocked(true);
        setDenied(true); setAsking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => { if (!coords && !denied) request(); }, []);
  return { coords, denied, hardBlocked, asking, request };
}

// ── Full-screen restaurant map ────────────────────────────────────────────────
function RestaurantMapModal({ vendors, customerCoords, onVendorSelect, onClose }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [selected,   setSelected]  = useState(null);
  const [mapReady,   setMapReady]  = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let mounted = true;

    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const defaultCenter = customerCoords
        ? [customerCoords.lng, customerCoords.lat]
        : vendors.find(v => v.latitude)
          ? [Number(vendors.find(v => v.latitude).longitude), Number(vendors.find(v => v.latitude).latitude)]
          : [39.2083, -6.7924]; // Dar es Salaam

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: defaultCenter,
        zoom: customerCoords ? 14 : 12,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      if (customerCoords) {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 20px; height: 20px; background: #2563eb;
          border: 3px solid white; border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(37,99,235,0.2);
        `;
        new mapboxgl.Marker({ element: el })
          .setLngLat([customerCoords.lng, customerCoords.lat])
          .addTo(map);
      }

      vendors.forEach(v => {
        if (!v.latitude || !v.longitude) return;
        const lat = Number(v.latitude);
        const lng = Number(v.longitude);

        const el = document.createElement("div");
        el.style.cssText = `
          background: white; border: 2.5px solid #e53935; border-radius: 12px;
          padding: 5px 10px; font-size: 13px; font-weight: 700;
          font-family: DM Sans, sans-serif; white-space: nowrap;
          box-shadow: 0 3px 12px rgba(0,0,0,0.18); display: flex;
          align-items: center; gap: 5px; cursor: pointer; max-width: 140px;
          transition: transform 0.15s;
        `;
        el.innerHTML = `
          <span style="font-size:16px">${v.image || "🍽️"}</span>
          <span style="color:#0f0f0f;overflow:hidden;text-overflow:ellipsis">${v.name}</span>
        `;
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.05)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", () => {
          map.flyTo({ center: [lng, lat], zoom: 16, duration: 600 });
          setSelected(v);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      map.on("click", () => setSelected(null));
      map.on("load", () => {
        if (mounted) {
          map.resize();
          setTimeout(() => { if (mounted) map.resize(); }, 300);
          setMapReady(true);
        }
      });
      mapRef.current = map;
    }).catch(console.error);

    return () => {
      mounted = false;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const mappableCount = vendors.filter(v => v.latitude).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", flexDirection: "column", background: "#f7f5f2",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", zIndex: 1,
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 17, margin: 0, fontFamily: "Georgia,serif" }}>
            🗺️ Restaurants Near You
          </p>
          <p style={{ fontSize: 12, color: "#7a7065", margin: "2px 0 0" }}>
            {mappableCount === 0 ? "No restaurants have set their location yet" : `${mappableCount} restaurants on the map`}
          </p>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "#f7f5f2", border: "none", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f5f2", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🗺️</div>
            <p style={{ fontSize: 14, color: "#7a7065" }}>Loading map…</p>
          </div>
        )}

        {mapReady && mappableCount === 0 && (
          <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 14, padding: "12px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 13, color: "#7a7065", whiteSpace: "nowrap" }}>
            😕 No restaurants have pinned their location yet
          </div>
        )}

        {selected && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "flex-start", gap: 14, animation: "slideUp 0.2s ease" }} onClick={() => onVendorSelect("vendor", selected)}>
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "#e8e4df" }} />
            <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "#f7f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, border: "1px solid #e8e4df" }}>
              {selected.cover_image_url ? <img src={selected.cover_image_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selected.image || "🍽️"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 16, margin: "0 0 2px", fontFamily: "Georgia,serif" }}>{selected.name}</p>
              <p style={{ fontSize: 12, color: "#7a7065", margin: "0 0 6px" }}>{selected.category}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#7a7065" }}>
                <span>⭐ {selected.rating || "New"}</span>
                {selected.distance && <span>📍 {selected.distance}</span>}
                <span>⏱ {selected.delivery_time || selected.deliveryTime || "20-35 min"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home({ navigate }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const { coords } = useCustomerLocation();

  useEffect(() => {
    vendorsApi.list()
      .then(({ vendors: data }) => setVendors(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val) => typeof val === "number" ? `${val.toLocaleString()} TSh` : val;

  return (
    <div className="home-v2">
      <div className="hv2-header">
        <div>
          <div className="hv2-logo">kivo</div>
          <p className="hv2-tagline">Fresh meals delivered straight to your door</p>
        </div>
        {MAPBOX_TOKEN && (
          <button className="add-btn" onClick={() => setShowMap(true)} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 12 }}>
            🗺️ View Map
          </button>
        )}
      </div>

      {showMap && (
        <RestaurantMapModal
          vendors={vendors}
          customerCoords={coords}
          onVendorSelect={navigate}
          onClose={() => setShowMap(false)}
        />
      )}

      <section className="vendors-section" style={{ padding: "8px 16px 100px" }}>
        {loading ? (
          <p>Loading vendors...</p>
        ) : (
          <div className="vendors-grid">
            {vendors.map(v => {
              const tagColor = v.tag_color || "#e53935";
              const deliveryTime = v.delivery_time || "20–35 min";
              const deliveryFee = v.delivery_fee ?? 2000;

              return (
                <div key={v.id} className="vendor-card" onClick={() => navigate("vendor", v)}>
                  {v.cover_image_url ? (
                    <div className="vendor-img" style={{ padding: 0, overflow: "hidden" }}>
                      <img src={v.cover_image_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {v.tag && <span className="vendor-tag" style={{ background: tagColor }}>{v.tag}</span>}
                    </div>
                  ) : (
                    <div className="vendor-img">
                      <span>{v.image || "🍽️"}</span>
                      {v.tag && <span className="vendor-tag" style={{ background: tagColor }}>{v.tag}</span>}
                    </div>
                  )}
                  <div className="vendor-info">
                    <div className="vendor-header">
                      <h3>{v.name}</h3>
                      <span className="vendor-rating">⭐ {v.rating}</span>
                    </div>
                    <p className="vendor-category">{v.category}</p>
                    <div className="vendor-meta">
                      {v.distance && <span>📍 {v.distance}</span>}
                      <span>⏱ {deliveryTime}</span>
                      <span>🛵 {fmt(deliveryFee)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <div style={{ height: 20 }} />
    </div>
  );
}