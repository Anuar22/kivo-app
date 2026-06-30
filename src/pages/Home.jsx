import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import { fmt } from "../utils/currency.js";
import { useTheme } from "../context/ThemeContext.jsx"; // ── Imported Theme Context

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
function RestaurantMapModal({ vendors, customerCoords, onVendorSelect, onClose, darkMode }) {
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
        style: darkMode ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12",
        center: defaultCenter,
        zoom: customerCoords ? 14 : 12,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      if (customerCoords) {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 20px; height: 20px; background: #e53935;
          border: 3px solid white; border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(229,57,53,0.3);
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
          background: ${darkMode ? "#1e1e1e" : "white"};
          border: 2px solid #e53935;
          border-radius: 12px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 700;
          font-family: DM Sans, sans-serif;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.15s;
        `;
        el.innerHTML = `
          <span style="font-size:16px">${v.image || "🍽️"}</span>
          <span style="color:${darkMode ? "#f5f5f5" : "#0f0f0f"}">${v.name}</span>
        `;
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
    };
  }, []);

  const mappableCount = vendors.filter(v => v.latitude).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", flexDirection: "column",
      background: darkMode ? "#121212" : "#fafaf9",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        background: darkMode ? "#1e1e1e" : "white",
        borderBottom: darkMode ? "1px solid #2d2c2a" : "1px solid #f4f1ed",
        zIndex: 1,
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, margin: 0, fontFamily: "DM Sans, sans-serif", color: darkMode ? "#f5f5f5" : "#362f2d" }}>
            📍 Nearby Vendors
          </p>
          <p style={{ fontSize: 12, color: darkMode ? "#a3978c" : "#7a7065", margin: "2px 0 0" }}>
            {mappableCount === 0 ? "No active locations mapped" : `${mappableCount} places ready`}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: darkMode ? "#2d2c2a" : "#fafaf9", border: "none",
            fontSize: 14, cursor: "pointer", color: darkMode ? "#f5f5f5" : "#362f2d",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      </div>

      {/* Map Display area */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: darkMode ? "#121212" : "#fafaf9", gap: 12 }}>
            <p style={{ fontSize: 13, color: darkMode ? "#a3978c" : "#7a7065" }}>Initializing Radar View…</p>
          </div>
        )}

        {selected && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: darkMode ? "#1e1e1e" : "white",
            borderRadius: "24px 24px 0 0",
            padding: "20px 20px 32px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: darkMode ? "#121212" : "#fafaf9",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>
              {selected.image || "🍽️"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 2px", color: darkMode ? "#f5f5f5" : "#362f2d", fontFamily: "DM Sans" }}>{selected.name}</p>
              <div style={{ display: "flex", gap: 8, fontSize: 12, color: darkMode ? "#a3978c" : "#7a7065" }}>
                <span>⭐ {selected.rating || "New"}</span>
                <span>⏱️ {selected.deliveryTime}</span>
              </div>
            </div>
            <button
              onClick={() => { onVendorSelect(selected); onClose(); }}
              style={{
                background: "#e53935", border: "none", borderRadius: 12,
                padding: "10px 16px", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer"
              }}
            >
              View Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Home Dashboard ───────────────────────────────────────────────────────
export default function Home({ navigate }) {
  const { darkMode } = useTheme(); // ── Hook connected here
  const [showMap,         setShowMap]         = useState(false);
  const [search,          setSearch]          = useState("");
  const [activeCategory,  setActiveCategory]  = useState(1);
  const [vendors,         setVendors]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const { coords, denied, hardBlocked, asking, request } = useCustomerLocation();

  useEffect(() => {
    vendorsApi.list(null, coords)
      .then(({ vendors }) => setVendors(vendors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords]);

  const filtered = vendors.filter(v => {
    const catName     = categories.find(c => c.id === activeCategory)?.name;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === 1 || v.category === catName;
    return matchSearch && matchCat;
  });

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? v.deliveryFee  ?? 2),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor:     v.tag_color ?? v.tagColor ?? "#ff6b35",
    reviewCount:  v.review_count ?? v.reviews ?? 0,
  });

  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  return (
    <div style={{
      background: darkMode ? "#121212" : "#fafaf9",
      minHeight: "100vh",
      fontFamily: "DM Sans, sans-serif",
      boxSizing: "border-box",
      transition: "background 0.2s ease-in-out",
      paddingBottom: 40
    }}>

      {showMap && (
        <RestaurantMapModal
          vendors={vendors.map(shape)}
          customerCoords={coords}
          onVendorSelect={v => navigate("vendor", v)}
          onClose={() => setShowMap(false)}
          darkMode={darkMode}
        />
      )}

      {/* ── Top Premium Address Banner & Header Row ── */}
      <div style={{
        padding: "calc(var(--sat) + 16px) 16px 12px",
        background: darkMode ? "#1e1e1e" : "white",
        borderBottom: darkMode ? "1px solid #1a1a19" : "1px solid #f2eee9"
      }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: darkMode ? "#a3978c" : "#7a7065", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Delivering To
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d", display: "flex", alignItems: "center", gap: 4 }}>
            📍 {coords ? "Current Location" : "Dar es Salaam, TZ"}
          </h1>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e53935", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>
            K
          </div>
        </div>

        {/* Search Bar Block */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
          <div style={{
            flex: 1, height: 46, borderRadius: 14,
            background: darkMode ? "#121212" : "#f5f3f0",
            display: "flex", alignItems: "center", padding: "0 14px",
            border: darkMode ? "1px solid #2d2c2a" : "1px solid transparent"
          }}>
            <span style={{ marginRight: 8, fontSize: 15, color: "#7a7065" }}>🔍</span>
            <input
              placeholder="Search dishes or kitchen vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", background: "none", border: "none", outline: "none",
                fontSize: 13, fontWeight: 500, color: darkMode ? "#f5f5f5" : "#362f2d"
              }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#7a7065", cursor: "pointer" }}>✕</button>}
          </div>

          <button
            onClick={() => { if (!coords && !denied) request(); setShowMap(true); }}
            style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: "#e53935", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(229,57,53,0.25)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Location Nudge panel */}
      {!coords && denied && (
        <div style={{
          margin: "12px 16px", padding: 12, borderRadius: 14,
          background: darkMode ? "#1e1e1e" : "white",
          border: darkMode ? "1px solid #2d2c2a" : "1px solid #e8e4df",
          display: "flex", alignItems: "center", justifyBetween: "space-between", gap: 10
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: darkMode ? "#f5f5f5" : "#362f2d" }}>Location Radar Disabled</p>
            <p style={{ fontSize: 11, color: "#7a7065", margin: "2px 0 0" }}>Enable GPS parameters to list precise delivery distances.</p>
          </div>
          {!hardBlocked && (
            <button onClick={request} style={{ background: "#e53935", color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Allow
            </button>
          )}
        </div>
      )}

      {/* Promo Banner Element */}
      {!search && (
        <div style={{
          margin: "16px 16px 0", padding: 16, borderRadius: 20,
          background: "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)",
          color: "white", display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 6px 20px rgba(229,57,53,0.15)"
        }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 6, uppercase: "true" }}>Promo</span>
            <h3 style={{ margin: "6px 0 2px", fontSize: 15, fontWeight: 700 }}>Free delivery on your 1st order!</h3>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>Use voucher code <strong style={{ textDecoration: "underline" }}>KIVO1ST</strong></p>
          </div>
          <span style={{ fontSize: 32 }}>🛵</span>
        </div>
      )}

      {/* ── Category Horizontal Carousel ── */}
      <div style={{ padding: "16px 0 4px" }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
          {categories.map(cat => {
            const isSel = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 100, border: "none", cursor: "pointer", flexShrink: 0,
                  fontSize: 13, fontWeight: 600,
                  background: isSel ? "#e53935" : (darkMode ? "#1e1e1e" : "white"),
                  color: isSel ? "white" : (darkMode ? "#cbc2ba" : "#5c534c"),
                  boxShadow: isSel ? "0 4px 12px rgba(229,57,53,0.2)" : "none",
                  transition: "all 0.15s"
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Popular Meals Carousel ── */}
      {activeCategory === 1 && !search && (
        <div style={{ marginTop: 12 }}>
          <h2 style={{ padding: "0 16px", margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>
            🔥 Popular Right Now
          </h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
            {popularMeals.map(meal => (
              <div
                key={meal.id}
                onClick={() => {
                  const v = vendors.find(vend => vend.id === meal.vendorId);
                  if (v) navigate("vendor", shape(v));
                }}
                style={{
                  background: darkMode ? "#1e1e1e" : "white",
                  borderRadius: 16, padding: 12, width: 140, flexShrink: 0, cursor: "pointer",
                  boxShadow: darkMode ? "none" : "0 4px 12px rgba(0,0,0,0.01)"
                }}
              >
                <div style={{ height: 75, background: darkMode ? "#121212" : "#fafaf9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  {meal.image}
                </div>
                <p style={{ margin: "8px 0 2px", fontSize: 13, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meal.name}</p>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#7a7065", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meal.vendorName}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e53935" }}>{fmt(meal.price)}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: darkMode ? "#a3978c" : "#7a7065" }}>⭐ {meal.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Vertical Restaurants List ── */}
      <div style={{ marginTop: 24, padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>
            {search ? `Results for "${search}"` : "🏪 Nearby Kitchen Vendors"}
          </h2>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#7a7065", background: darkMode ? "#1e1e1e" : "#eae6e1", padding: "2px 8px", borderRadius: 8 }}>
            {loading ? "…" : `${filtered.length} open`}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#7a7065", fontSize: 13 }}>Loading kitchens…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "#7a7065", background: darkMode ? "#1e1e1e" : "white", borderRadius: 20 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No kitchens matching parameters.</p>
            <p style={{ margin: "2px 0 0", fontSize: 12 }}>Try expanding your search filter keywords.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map(raw => {
              const v = shape(raw);
              return (
                <div 
                  key={v.id} 
                  onClick={() => navigate("vendor", v)}
                  style={{
                    background: darkMode ? "#1e1e1e" : "white",
                    borderRadius: 20, overflow: "hidden", cursor: "pointer",
                    boxShadow: darkMode ? "none" : "0 4px 16px rgba(0,0,0,0.02)",
                    display: "flex", flexDirection: "column"
                  }}
                >
                  {/* Cover Image Header Section */}
                  <div style={{ height: 130, background: darkMode ? "#252524" : "#f2eee9", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {v.cover_image_url ? (
                      <img src={v.cover_image_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 44 }}>{v.image || "🏪"}</span>
                    )}
                    {v.tag && (
                      <span style={{ position: "absolute", top: 12, left: 12, background: v.tagColor, color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, uppercase: "true" }}>
                        {v.tag}
                      </span>
                    )}
                  </div>

                  {/* Vendor Meta Details */}
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d" }}>{v.name}</h3>
                      <span style={{ fontSize: 12, fontWeight: 700, color: darkMode ? "#f5f5f5" : "#362f2d", display: "flex", alignItems: "center", gap: 2 }}>
                        ⭐ {v.rating}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 10px", fontSize: 12, color: "#7a7065" }}>{v.category}</p>
                    
                    <div style={{ height: 1, background: darkMode ? "#2d2c2a" : "#f5f3f0", marginBottom: 10 }} />
                    
                    <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 500, color: darkMode ? "#a3978c" : "#7a7065" }}>
                      {v.distance && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>📍 {v.distance}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>⏱️ {v.deliveryTime}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>🛵 Delivery: {fmt(v.deliveryFee)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}