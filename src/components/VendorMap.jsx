import { useEffect, useRef, useState } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

export default function VendorMap({ vendors, customerCoords, onVendorSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const popupRef     = useRef(null);
  const [selected,  setSelected]  = useState(null);
  const [mapError,  setMapError]  = useState("");

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN) { setMapError("VITE_MAPBOX_TOKEN is not set."); return; }
    let mounted = true;

    loadMapbox().then(mapboxgl => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const defaultCenter = customerCoords
        ? [customerCoords.lng, customerCoords.lat]
        : vendors.find(v => v.latitude)
          ? [Number(vendors.find(v => v.latitude).longitude), Number(vendors.find(v => v.latitude).latitude)]
          : [36.817223, -1.286389]; // Nairobi fallback

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: defaultCenter,
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      // Customer "You" pin
      if (customerCoords) {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 18px; height: 18px; background: #e53935;
          border: 3px solid white; border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(229,57,53,0.3);
        `;
        new mapboxgl.Marker({ element: el })
          .setLngLat([customerCoords.lng, customerCoords.lat])
          .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false })
            .setHTML(`<p style="font-size:12px;font-weight:600;margin:0;font-family:DM Sans,sans-serif">📍 You're here</p>`))
          .addTo(map);
      }

      mapRef.current = map;
      addVendorMarkers(map, mapboxgl, vendors, setSelected, markersRef);
    }).catch(e => {
      if (mounted) setMapError(e.message);
    });

    return () => { mounted = false; };
  }, []);

  // ── Re-render vendor markers when vendor list changes (filter) ────────────
  useEffect(() => {
    if (!mapRef.current || !window.mapboxgl) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    addVendorMarkers(mapRef.current, window.mapboxgl, vendors, setSelected, markersRef);
  }, [vendors]);

  if (mapError) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#7a7065", gap: 8 }}>
      <span style={{ fontSize: 32 }}>🗺️</span>
      <p style={{ fontSize: 14 }}>{mapError}</p>
    </div>
  );

  const mappableCount = vendors.filter(v => v.latitude).length;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

      {/* No locations warning */}
      {mappableCount === 0 && (
        <div style={{
          position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
          background: "white", borderRadius: 12, padding: "10px 16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)", fontSize: 13, color: "#7a7065",
          whiteSpace: "nowrap", zIndex: 1,
        }}>
          😕 No restaurants have set their location yet
        </div>
      )}

      {/* Vendor popup card */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 16, left: 16, right: 16,
          background: "white", borderRadius: 16, padding: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)", zIndex: 1,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>{selected.image || "🍽️"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.name}</p>
            <p style={{ fontSize: 12, color: "#7a7065", marginBottom: 4 }}>{selected.category}</p>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#7a7065" }}>
              <span>⭐ {selected.rating}</span>
              {selected.distance && <span>📍 {selected.distance}</span>}
              <span>⏱ {selected.delivery_time || selected.deliveryTime}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => { onVendorSelect(selected); setSelected(null); }}
              style={{
                background: "#e53935", border: "none", borderRadius: 10,
                padding: "8px 14px", color: "white", fontWeight: 700,
                fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
              }}
            >
              Order
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "none", border: "1.5px solid #e8e4df", borderRadius: 10,
                padding: "6px 14px", color: "#7a7065", fontSize: 12,
                cursor: "pointer", fontFamily: "DM Sans, sans-serif",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: add vendor markers to a Mapbox map instance ──────────────────────
function addVendorMarkers(map, mapboxgl, vendors, setSelected, markersRef) {
  vendors.forEach(v => {
    if (!v.latitude || !v.longitude) return;
    const lat = Number(v.latitude);
    const lng = Number(v.longitude);

    const el = document.createElement("div");
    el.style.cssText = `
      background: white;
      border: 2px solid #e53935;
      border-radius: 10px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 700;
      font-family: DM Sans, sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      max-width: 120px;
    `;
    el.innerHTML = `
      <span>${v.image || "🍽️"}</span>
      <span style="color:#0f0f0f;overflow:hidden;text-overflow:ellipsis">${v.name}</span>
    `;
    el.addEventListener("click", () => {
      setSelected(v);
      map.panTo([lng, lat]);
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map);

    markersRef.current.push(marker);
  });
}
