import { useEffect, useRef, useState } from "react";

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload  = () => resolve(window.L);
    s.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(s);
  });
}

export default function VendorMap({ vendors, customerCoords, onVendorSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [selected, setSelected] = useState(null); // vendor popup
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let mounted = true;
    loadLeaflet().then(L => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      // Default center: customer if available, else first vendor with coords, else Nairobi
      const defaultCenter = customerCoords
        ? [customerCoords.lat, customerCoords.lng]
        : vendors.find(v => v.latitude)
          ? [Number(vendors.find(v => v.latitude).latitude), Number(vendors.find(v => v.latitude).longitude)]
          : [-1.286389, 36.817223];

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(defaultCenter, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Customer pin
      if (customerCoords) {
        const youIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:#e53935;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(229,57,53,0.3)"></div>`,
          className: "",
          iconAnchor: [7, 7],
        });
        L.marker([customerCoords.lat, customerCoords.lng], { icon: youIcon })
          .addTo(map)
          .bindTooltip("You're here", { permanent: false });
      }

      // Vendor pins
      vendors.forEach(v => {
        if (!v.latitude || !v.longitude) return;
        const lat = Number(v.latitude);
        const lng = Number(v.longitude);

        const icon = L.divIcon({
          html: `
            <div style="
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
              transform: translateX(-50%);
            ">
              <span>${v.image || "🍽️"}</span>
              <span style="color:#0f0f0f;max-width:80px;overflow:hidden;text-overflow:ellipsis">${v.name}</span>
            </div>
          `,
          className: "",
          iconAnchor: [0, 0],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.on("click", () => {
          setSelected(v);
          map.panTo([lat, lng]);
        });
        markersRef.current.push(marker);
      });

      mapRef.current = map;
    }).catch(e => {
      if (mounted) setMapError(e.message);
    });

    return () => { mounted = false; };
  }, []);

  // Update vendor markers when vendors list changes (e.g. filter)
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    vendors.forEach(v => {
      if (!v.latitude || !v.longitude) return;
      const icon = L.divIcon({
        html: `
          <div style="
            background:white;border:2px solid #e53935;border-radius:10px;
            padding:4px 8px;font-size:12px;font-weight:700;
            font-family:DM Sans,sans-serif;white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            display:flex;align-items:center;gap:4px;transform:translateX(-50%);
          ">
            <span>${v.image || "🍽️"}</span>
            <span style="color:#0f0f0f;max-width:80px;overflow:hidden;text-overflow:ellipsis">${v.name}</span>
          </div>
        `,
        className: "",
        iconAnchor: [0, 0],
      });
      const marker = L.marker([Number(v.latitude), Number(v.longitude)], { icon }).addTo(mapRef.current);
      marker.on("click", () => {
        setSelected(v);
        mapRef.current.panTo([Number(v.latitude), Number(v.longitude)]);
      });
      markersRef.current.push(marker);
    });
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
          whiteSpace: "nowrap", zIndex: 1000,
        }}>
          😕 No restaurants have set their location yet
        </div>
      )}

      {/* Vendor popup card */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 16, left: 16, right: 16,
          background: "white", borderRadius: 16, padding: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)", zIndex: 1000,
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
