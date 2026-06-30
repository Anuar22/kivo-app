import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import { fmt } from "../utils/currency.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Inject component styles strictly once ─────────────────────────────────────
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .home-page-container {
    font-family: 'DM Sans', sans-serif;
    background: #f7f5f2;
    color: #0f0f0f;
    min-height: 100vh;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 16px));
    box-sizing: border-box;
  }
  .home-hero {
    background: linear-gradient(135deg, #1a1513 0%, #2d221e 100%);
    color: white;
    padding: 24px 20px 28px;
    border-radius: 0 0 28px 28px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .greeting-sub { font-size: 14px; opacity: 0.7; margin: 0 0 4px; }
  .greeting-main { font-size: 26px; font-weight: 800; margin: 0 0 20px; line-height: 1.2; font-family: 'Georgia', serif; }
  .greeting-main em { color: #ff6b35; font-style: normal; }
  .search-bar-wrapper {
    display: flex; gap: 10px; align-items: center;
  }
  .search-bar {
    flex: 1; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 10px;
  }
  .search-bar input {
    background: none; border: none; color: white; width: 100%; outline: none; font-size: 14px;
  }
  .search-bar input::placeholder { color: rgba(255,255,255,0.5); }
  .clear-search { background: none; border: none; color: white; opacity: 0.6; cursor: pointer; }
  .promo-banner {
    margin: 20px 16px 8px; background: #ffe8da; border: 1px solid #ffcdb2;
    border-radius: 18px; padding: 16px; display: flex; align-items: center; justify-content: space-between;
  }
  .promo-tag { background: #ff6b35; color: white; font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 6px; }
  .promo-text h3 { margin: 6px 0 2px; font-size: 16px; font-weight: 800; color: #2d221e; }
  .promo-text p { margin: 0; font-size: 12px; color: #7a7065; }
  .promo-art { font-size: 38px; }
  .categories-scroll {
    display: flex; gap: 10px; overflow-x: auto; padding: 16px; scrollbar-width: none;
  }
  .categories-scroll::-webkit-scrollbar { display: none; }
  .cat-pill {
    display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e8e4df;
    padding: 10px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; transition: all 0.2s;
  }
  .cat-pill.active { background: #e53935; color: white; border-color: #e53935; box-shadow: 0 4px 12px rgba(229,57,53,0.2); }
  .section-layout { padding: 0 16px; margin-bottom: 24px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .section-header h2 { font-size: 18px; font-weight: 800; margin: 0; font-family: 'Georgia', serif; }
  .section-count { font-size: 13px; color: #7a7065; font-weight: 600; }
  .popular-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
  .popular-scroll::-webkit-scrollbar { display: none; }
  .popular-card {
    background: white; border: 1px solid #e8e4df; border-radius: 18px; padding: 14px;
    min-width: 140px; width: 140px; flex-shrink: 0; cursor: pointer;
  }
  .popular-emoji { font-size: 32px; display: block; margin-bottom: 8px; text-align: center; }
  .popular-name { font-weight: 700; font-size: 13px; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .popular-vendor { font-size: 11px; color: #7a7065; margin: 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .popular-bottom { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; }
  .popular-price { color: #e53935; }
  .vendors-list { display: flex; flex-direction: column; gap: 16px; }
  .vendor-card {
    background: white; border: 1px solid #e8e4df; border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column; cursor: pointer;
  }
  .vendor-img { height: 150px; width: 100%; background: #e8e4df; display: flex; align-items: center; justify-content: center; font-size: 48px; position: relative; }
  .vendor-tag { position: absolute; top: 12px; left: 12px; color: white; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
  .vendor-info { padding: 14px; }
  .vendor-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .vendor-header h3 { font-size: 16px; font-weight: 800; margin: 0 0 2px; font-family: 'Georgia', serif; }
  .vendor-rating { font-size: 13px; font-weight: 700; background: #fff8e1; color: #b8860b; padding: 2px 6px; border-radius: 6px; }
  .vendor-category { font-size: 12px; color: #7a7065; margin: 0 0 10px; }
  .vendor-meta { display: flex; gap: 12px; font-size: 12px; color: #7a7065; font-weight: 500; }
  .hv2-nudge { display: flex; align-items: center; gap: 12px; background: #fff8f5; border: 1px solid #ffe8da; padding: 12px 16px; border-radius: 14px; }
  .hv2-nudge-btn { background: #e53935; color: white; border: none; padding: 6px 12px; font-weight: 700; font-size: 12px; border-radius: 8px; cursor: pointer; }
  .empty-state { text-align: center; padding: 40px 20px; color: #7a7065; }
  .empty-state p { margin: 0; font-weight: 700; font-size: 14px; }
  .empty-state span { font-size: 12px; opacity: 0.8; }
`;
document.head.appendChild(styleTag);

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
  }, [vendors, customerCoords]);

  const mappableCount = vendors.filter(v => v.latitude).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "#f7f5f2" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", zIndex: 1 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 17, margin: 0, fontFamily: "Georgia,serif" }}>🗺️ Restaurants Near You</p>
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
        {selected && (
          <div className="slideUp" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "flex-start", gap: 14 }}>
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
                <span>🛵 {fmt(selected.deliveryFee)}</span>
              </div>
            </div>
            <button onClick={() => { onVendorSelect("vendor", selected); onClose(); }} style={{ background: "#e53935", border: "none", borderRadius: 12, padding: "10px 18px", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Order</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home({ navigate }) {
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

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? v.deliveryFee  ?? 2000),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor:     v.tag_color ?? v.tagColor ?? "#ff6b35",
    reviewCount:  v.review_count ?? v.reviews ?? 0,
  });

  const filtered = vendors.filter(v => {
    const catName     = categories.find(c => c.id === activeCategory)?.name;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === 1 || v.category === catName;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  return (
    <div className="home-page-container">
      {showMap && <RestaurantMapModal vendors={vendors.map(shape)} customerCoords={coords} onVendorSelect={navigate} onClose={() => setShowMap(false)} />}

      <div className="home-hero">
        <div>
          <p className="greeting-sub">Good afternoon 👋</p>
          <h1 className="greeting-main">What are you <br /><em>craving today?</em></h1>
        </div>

        <div className="search-bar-wrapper">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search food or restaurants..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="clear-search" onClick={() => setSearch("")}>✕</button>}
          </div>
          <button onClick={() => { if (!coords && !denied) request(); setShowMap(true); }} style={{ width: 46, height: 46, borderRadius: 14, background: coords ? "#e53935" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: coords ? "0 4px 12px rgba(229,57,53,0.4)" : "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </div>
        {coords && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, margin: "8px 0 0" }}>📍 Showing restaurants near you</p>}
      </div>

      {!coords && denied && (
        <div className="hv2-nudge" style={{ margin: "12px 16px" }}>
          <span>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{hardBlocked ? "Location blocked" : "Enable location"}</p>
            <p style={{ fontSize: 12, color: "#7a7065", margin: "2px 0 0" }}>We'll show closest restaurants first</p>
          </div>
          {!hardBlocked && <button className="hv2-nudge-btn" onClick={request} disabled={asking}>{asking ? "…" : "Allow"}</button>}
        </div>
      )}

      {!search && (
        <div className="promo-banner">
          <div className="promo-text">
            <span className="promo-tag">🔥 LIMITED TIME</span>
            <h3>Free delivery on first order!</h3>
            <p>Use code <strong>KIVO1ST</strong></p>
          </div>
          <div className="promo-art">🛵</div>
        </div>
      )}

      <div className="categories-scroll">
        {categories.map(cat => (
          <button key={cat.id} className={`cat-pill ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
            <span>{cat.emoji}</span><span>{cat.name}</span>
          </button>
        ))}
      </div>

      {activeCategory === 1 && !search && (
        <div className="section-layout">
          <div className="section-header"><h2>🔥 Popular Right Now</h2></div>
          <div className="popular-scroll">
            {popularMeals.map(meal => (
              <div key={meal.id} className="popular-card" onClick={() => { const v = vendors.find(vd => vd.id === meal.vendorId); if (v) navigate("vendor", shape(v)); }}>
                <span className="popular-emoji">{meal.image}</span>
                <p className="popular-name">{meal.name}</p>
                <p className="popular-vendor">{meal.vendorName}</p>
                <div className="popular-bottom"><span className="popular-price">{fmt(meal.price)}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-layout">
        <div className="section-header">
          <h2>{search ? `Results for "${search}"` : "🏪 Nearby Restaurants"}</h2>
          <span className="section-count">{loading ? "..." : `${filtered.length} places`}</span>
        </div>
        {loading ? (
          <div className="empty-state"><p>Loading restaurants...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>😕 No results found</p></div>
        ) : (
          <div className="vendors-list">
            {filtered.map(raw => {
              const v = shape(raw);
              return (
                <div key={v.id} className="vendor-card" onClick={() => navigate("vendor", v)}>
                  <div className="vendor-img">
                    {v.cover_image_url ? <img src={v.cover_image_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{v.image}</span>}
                    {v.tag && <span className="vendor-tag" style={{ background: v.tagColor }}>{v.tag}</span>}
                  </div>
                  <div className="vendor-info">
                    <div className="vendor-header"><h3>{v.name}</h3><span className="vendor-rating">⭐ {v.rating}</span></div>
                    <p className="vendor-category">{v.category}</p>
                    <div className="vendor-meta">⏱ {v.deliveryTime} · 🛵 {fmt(v.deliveryFee)}</div>
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