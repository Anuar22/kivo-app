import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories } from "../data/index.js";
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
          : [39.2083, -6.7924];

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
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
          background: #1a1a1a; border: 2.5px solid #e53935; border-radius: 12px;
          padding: 5px 10px; font-size: 13px; font-weight: 700; font-family: DM Sans, sans-serif;
          white-space: nowrap; box-shadow: 0 3px 12px rgba(0,0,0,0.4); display: flex;
          align-items: center; gap: 5px; cursor: pointer; max-width: 140px; transition: transform 0.15s;
        `;
        el.innerHTML = `
          <span style="font-size:16px">${v.image || "🍽️"}</span>
          <span style="color:#ffffff;overflow:hidden;text-overflow:ellipsis">${v.name}</span>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "#000000" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", paddingTop: "calc(var(--sat) + 16px)", background: "#121212", borderBottom: "1px solid #222" }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 17, margin: 0, fontFamily: "Georgia,serif", color: "#ffffff" }}>🗺️ Restaurants Near You</p>
          <p style={{ fontSize: 12, color: "#a0a0a0", margin: "2px 0 0" }}>
            {mappableCount === 0 ? "No restaurants have set their location yet" : `${mappableCount} restaurant${mappableCount !== 1 ? "s" : ""} on the map`}
          </p>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "#222", border: "none", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>✕</button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#000000", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🗺️</div>
            <p style={{ fontSize: 14, color: "#a0a0a0" }}>Loading map…</p>
          </div>
        )}

        {mapReady && mappableCount === 0 && (
          <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#121212", border: "1px solid #222", borderRadius: 14, padding: "12px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", fontSize: 13, color: "#a0a0a0", whiteSpace: "nowrap" }}>
            😕 No restaurants have pinned their location yet
          </div>
        )}

        {selected && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "flex-start", gap: 14, animation: "slideUp 0.2s ease" }}>
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "#333" }} />
            <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, border: "1px solid #222" }}>
              {selected.cover_image_url ? <img src={selected.cover_image_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selected.image || "🍽️"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 16, margin: "0 0 2px", fontFamily: "Georgia,serif", color: "#000000" }}>{selected.name}</p>
              <p style={{ fontSize: 12, color: "#7a7065", margin: "0 0 6px" }}>{selected.category}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#7a7065" }}>
                <span>⭐ {selected.rating || "New"}</span>
                {selected.distance && <span>📍 {selected.distance}</span>}
                <span>⏱ {selected.delivery_time || selected.deliveryTime || "20–35 min"}</span>
                <span>🛵 {fmt(selected.delivery_fee ?? selected.deliveryFee ?? 2)}</span>
              </div>
            </div>
            <button onClick={() => { onVendorSelect(selected); onClose(); }} style={{ background: "#e53935", border: "none", borderRadius: 12, padding: "10px 18px", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>Order</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Home ─────────────────────────────────────────────────────────────────
export default function Home({ navigate }) {
  const [showMap,         setShowMap]         = useState(false);
  const [search,          setSearch]          = useState("");
  const [activeCategory,  setActiveCategory]  = useState(1);
  const [vendors,         setVendors]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [favorites,       setFavorites]       = useState(new Set(JSON.parse(localStorage.getItem("kivo_favorites") || "[]")));
  const [popularItems,    setPopularItems]    = useState([]);
  const [popularLoading,  setPopularLoading]  = useState(true);
  const { coords, denied, hardBlocked, asking, request } = useCustomerLocation();

  useEffect(() => {
    vendorsApi.list(null, coords)
      .then(({ vendors }) => setVendors(vendors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords]);

  useEffect(() => {
    vendorsApi.popularItems(8)
      .then(({ items }) => setPopularItems(items))
      .catch(() => {})
      .finally(() => setPopularLoading(false));
  }, []);

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? v.deliveryFee  ?? 2),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor:     v.tag_color ?? v.tagColor ?? "#e53935",
    reviewCount:  v.review_count ?? v.reviews ?? 0,
  });

  const toggleFavorite = (vendorId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vendorId)) {
      newFavorites.delete(vendorId);
    } else {
      newFavorites.add(vendorId);
    }
    setFavorites(newFavorites);
    localStorage.setItem("kivo_favorites", JSON.stringify([...newFavorites]));
  };

  // Filter vendors
  const catName = categories.find(c => c.id === activeCategory)?.name;
  const filtered = vendors.filter(vendor => {
    const matchCat = activeCategory === 1 || vendor.category === catName;
    const matchSearch = !search || vendor.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const shapedVendors = vendors.map(shape);
  const topRatedCount = shapedVendors.filter(v => Number(v.rating) >= 4.7).length;
  const fastestVendor = shapedVendors.filter(v => v.deliveryTime).sort((a, b) => parseInt(a.deliveryTime, 10) - parseInt(b.deliveryTime, 10))[0];

  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  return (
    <div 
      className="page home-page" 
      style={{ 
        background: "#000000", 
        minHeight: "100vh", 
        color: "#ffffff", 
        padding: "0 16px",
        /* Pushes the container safely below the device status bar/notch area */
        paddingTop: "calc(var(--sat) + 16px)", 
        position: "relative"
      }}
    >

      {/* ── Full-screen map modal ── */}
      {showMap && (
        <RestaurantMapModal
          vendors={vendors.map(shape)}
          customerCoords={coords}
          onVendorSelect={v => navigate("vendor", v)}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* ── Clean Top Header ── */}
      <div className="home-hero" style={{ paddingTop: "0px", paddingBottom: "16px", background: "#000000" }}>
        <div className="home-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingTop: "8px" }}>
          
          {/* Profile Button (Left) */}
          <button onClick={() => navigate("profile")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label="View Profile">
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #e53935, #ff7043)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 2px 8px rgba(229,57,53,0.4)", color: "white", fontWeight: "bold" }}>
              A
            </div>
          </button>

          {/* Cart Button (Right) */}
          <button onClick={() => navigate("cart")} style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #e53935", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(229,57,53,0.2)", color: "#e53935" }} aria-label="View Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>

        {/* ── Search Input Row ── */}
        <div className="home-search-row" style={{ display: "flex", gap: "10px", width: "100%" }}>
          <div className="search-bar home-search" style={{ background: "#1a1a1a", border: "1px solid #222", flex: 1, borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search meals or restaurants"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: "#ffffff", background: "transparent", border: "none", outline: "none", flex: 1, fontSize: "14px" }}
              onFocus={(e) => e.target.parentElement.style.borderColor = "#e53935"}
              onBlur={(e) => e.target.parentElement.style.borderColor = "#222"}
            />
            {search && <button className="clear-search" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer" }}>✕</button>}
          </div>

          <button className="home-location-btn" onClick={() => (coords ? setShowMap(true) : request())} style={{ width: "46px", height: "46px", borderRadius: "14px", flexShrink: 0, background: "linear-gradient(135deg, #ff5a52, #d92828)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 22px rgba(229,57,53,0.28)" }} aria-label={coords ? "View restaurants near you" : "Use current location"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
            </svg>
          </button>
        </div>

        {/* ── Insights row ── */}
        <div className="home-insights" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#121212", borderRadius: "16px", padding: "16px 8px", border: "1px solid rgba(229, 57, 53, 0.35)", marginTop: "16px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid #222" }}>
            <strong style={{ color: "#e53935", fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>{topRatedCount || "-"}</strong>
            <span style={{ color: "#a0a0a0", fontSize: "12px", fontWeight: "500" }}>Top rated</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid #222" }}>
            <strong style={{ color: "#e53935", fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>{fastestVendor?.deliveryTime?.split(" ")[0] || "20"}</strong>
            <span style={{ color: "#a0a0a0", fontSize: "12px", fontWeight: "500" }}>Fastest ETA</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <strong style={{ color: "#e53935", fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>{favorites.size}</strong>
            <span style={{ color: "#a0a0a0", fontSize: "12px", fontWeight: "500" }}>Saved</span>
          </div>
        </div>
      </div>

      {/* ── Category pills ── */}
      <section className="section" style={{ marginTop: "16px", padding: 0 }}>
        <div className="categories-scroll" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-pill ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)} style={{ padding: "10px 18px", borderRadius: "100px", background: activeCategory === cat.id ? "#e53935" : "#1a1a1a", border: activeCategory === cat.id ? "1px solid #e53935" : "1px solid #222", color: "#ffffff", whiteSpace: "nowrap", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
              <span>{cat.emoji}</span><span style={{ marginLeft: "6px" }}>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Popular section with Auto-Scroll ── */}
      {activeCategory === 1 && !search && (popularLoading || popularItems.length > 0) && (
        <section className="section" style={{ marginTop: "24px", padding: 0 }}>
          <div className="section-header" style={{ marginBottom: "16px", padding: "0 4px" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.3px" }}>
              🔥 Popular Right Now
            </h2>
          </div>

          {popularLoading ? (
            <div style={{ display: "flex", gap: "14px", overflowX: "hidden" }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ background: "#121212", borderRadius: "18px", padding: "16px", width: "150px", flexShrink: 0, border: "1px solid #1c1c1e" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#1c1c1e", marginBottom: "14px" }} />
                  <div style={{ width: "80%", height: "12px", background: "#1c1c1e", borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ width: "60%", height: "10px", background: "#1c1c1e", borderRadius: "4px" }} />
                </div>
              ))}
            </div>
          ) : (
          <div 
            ref={(el) => {
              // Internal layout scroll loop handler
              if (!el) return;
              if (el.dataset.scrollInit) return;
              el.dataset.scrollInit = "true";

              let isPaused = false;
              let scrollSpeed = 0.6; // Adjust this smaller for slower, larger for faster speed

              const autoScroll = () => {
                if (!isPaused) {
                  // Increment scroll position
                  el.scrollLeft += scrollSpeed;
                  
                  // Reset smoothly to the start if it hits the maximum scroll width
                  if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
                    el.scrollLeft = 0;
                  }
                }
                requestAnimationFrame(autoScroll);
              };

              // Temporarily pause auto-scroll when user interacts by hand
              el.addEventListener("touchstart", () => isPaused = true, { passive: true });
              el.addEventListener("mousedown", () => isPaused = true);
              
              // Resume auto-scroll when user stops interacting
              el.addEventListener("touchend", () => isPaused = false, { passive: true });
              el.addEventListener("mouseup", () => isPaused = false);
              el.addEventListener("mouseleave", () => isPaused = false);

              // Kickoff animation frame
              requestAnimationFrame(autoScroll);
            }}
            className="popular-scroll" 
            style={{ 
              display: "flex", 
              gap: "14px", 
              overflowX: "auto", 
              paddingBottom: "8px", 
              scrollbarWidth: "none",
              scrollBehavior: "auto" // Keeps pixel-perfect layout increments smooth
            }} 
          >
            {popularItems.map(item => (
              <div 
                key={item.id} 
                className="popular-card" 
                style={{ 
                  background: "#121212", 
                  borderRadius: "18px", 
                  padding: "16px", 
                  width: "150px", 
                  flexShrink: 0, 
                  cursor: "pointer",
                  border: "1px solid #1c1c1e"
                }} 
                onClick={() => {
                  const v = vendors.find(v => v.id === item.vendor_id);
                  if (v) navigate("vendor", shape(v));
                }}
              >
                {/* Accent circular badge for image/emoji */}
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(229, 57, 53, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  marginBottom: "14px",
                  overflow: "hidden",
                }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (item.image || "🍽️")}
                </div>
                <p className="popular-name" style={{ color: "#ffffff", fontSize: "14px", fontWeight: "700", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </p>
                <p className="popular-vendor" style={{ color: "#a0a0a0", fontSize: "12px", margin: "0 0 14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.vendor_name}
                </p>
                <div className="popular-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="popular-price" style={{ color: "#e53935", fontSize: "15px", fontWeight: "800" }}>
                    {fmt(item.price)}
                  </span>
                  <span className="popular-rating" style={{ color: "#ffb300", fontSize: "12px", fontWeight: "600" }}>
                    ★ {item.rating || "New"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>
      )}

      {/* ── Restaurants grid (main display) ── */}
      <section className="section" style={{ marginTop: "32px", padding: 0 }}>
        <div style={{ marginBottom: "16px", padding: "0 4px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.3px" }}>
            {search ? `🔍 Results for "${search}"` : "🍽️ What's cooking"}
          </h2>
          <p style={{ fontSize: "12px", color: "#a0a0a0", margin: "4px 0 0", lineHeight: 1.4 }}>
            {activeCategory === 1 ? "All restaurants near you" : `${categories.find(c => c.id === activeCategory)?.name || ""} restaurants`}
          </p>
        </div>

        {loading ? (
          <div className="empty-state" style={{ textAlign: "center", padding: "40px 0" }}><p style={{ color: "#a0a0a0", margin: 0 }}>Loading restaurants...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", padding: "40px 0" }}><p style={{ color: "#a0a0a0", fontWeight: "600", margin: "0 0 4px" }}>😕 No restaurants found</p><span style={{ color: "#777", fontSize: "13px" }}>Try a different search or category</span></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: 0, marginBottom: "24px" }}>
            {filtered.map(vendor => {
              const v = shape(vendor);
              return (
                <div 
                  key={v.id} 
                  style={{ 
                    background: "#121212", 
                    borderRadius: "18px", 
                    border: "1px solid #1c1c1e", 
                    overflow: "hidden", 
                    cursor: "pointer", 
                    boxShadow: "0 6px 20px rgba(0,0,0,0.3)", 
                    display: "flex", 
                    flexDirection: "column" 
                  }} 
                  onClick={() => navigate("vendor", v)}
                >
                  {/* Image area */}
                  <div 
                    style={{ 
                      height: "115px", 
                      background: v.cover_image_url 
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${v.cover_image_url}) center/cover`
                        : "linear-gradient(135deg, #1a1a1a, #111111)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      position: "relative", 
                      fontSize: 38, 
                      color: "white"
                    }}
                  >
                    {!v.cover_image_url && (v.image || "🍽️")}
                    
                    {/* Dark Translucent Favorite Button */}
                    <button 
                      onClick={e => { e.stopPropagation(); toggleFavorite(v.id); }} 
                      style={{ 
                        position: "absolute", 
                        top: 8, 
                        right: 8, 
                        width: 32, 
                        height: 32, 
                        borderRadius: "50%", 
                        background: "rgba(0, 0, 0, 0.5)", 
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.1)", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: 14,
                        transition: "background 0.2s"
                      }}
                    >
                      {favorites.has(v.id) ? "❤️" : "🤍"}
                    </button>
                  </div>

                  {/* Content area */}
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 3px", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.name}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#a0a0a0", margin: "0 0 12px", lineHeight: 1.3 }}>
                      {v.category}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", fontSize: "12px", color: "#a0a0a0" }}>
                      <span style={{ color: "#e53935", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}>
                        ★ <span style={{ color: "#ffffff" }}>{v.rating || "New"}</span>
                      </span>
                      <span style={{ fontSize: "11px", color: "#a0a0a0", background: "#1c1c1e", padding: "3px 8px", borderRadius: "6px" }}>
                        ⏱ {v.deliveryTime.split(" ")[0]}
                      </span>
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