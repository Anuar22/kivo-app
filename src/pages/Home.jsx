import { useState, useEffect } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import { fmt } from "../utils/currency.js";
import VendorMap from "../components/VendorMap.jsx";

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
    } else {
      doRequest();
    }
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

export default function Home({ navigate }) {
  const [view,            setView]            = useState("list");
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
    const catName    = categories.find(c => c.id === activeCategory)?.name;
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchCat   = activeCategory === 1 || v.category === catName;
    return matchSearch && matchCat;
  });

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? v.deliveryFee  ?? 2),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor:     v.tag_color ?? v.tagColor ?? "#ff6b35",
    reviewCount:  v.review_count ?? v.reviews ?? 0,
  });

  return (
    <div className="page home-page">

      {/* ── Hero ── */}
      <div className="home-hero">
        <p className="greeting-sub">
          {coords ? "📍 Showing nearby restaurants" : "Good afternoon 👋"}
        </p>
        <h1 className="greeting-main">
          What are you <br /><em>craving today?</em>
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search food or restaurants..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="clear-search" onClick={() => setSearch("")}>✕</button>}
          </div>
          {/* Map toggle button */}
          <button
            onClick={() => setView(v => v === "map" ? "list" : "map")}
            style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: view === "map" ? "white" : "rgba(255,255,255,0.15)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            title={view === "map" ? "Switch to list" : "Switch to map"}
          >
            {view === "map"
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }
          </button>
        </div>
      </div>

      {/* ── Location nudge ── */}
      {!coords && denied && (
        <div className="hv2-nudge" style={{ margin: "12px 16px" }}>
          <span>📍</span>
          <div style={{ flex: 1 }}>
            {hardBlocked ? (
              <>
                <p style={{ fontWeight: 600, fontSize: 13 }}>Location blocked</p>
                <p style={{ fontSize: 12, color: "#999", marginTop: 1, lineHeight: 1.4 }}>
                  Go to browser Settings → Site permissions → Location → allow Kivo, then refresh.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, fontSize: 13 }}>Enable location for nearby results</p>
                <p style={{ fontSize: 12, color: "#999", marginTop: 1 }}>We'll show closest restaurants first</p>
              </>
            )}
          </div>
          {!hardBlocked && (
            <button className="hv2-nudge-btn" onClick={request} disabled={asking}>
              {asking ? "…" : "Allow"}
            </button>
          )}
        </div>
      )}

      {/* ── Map view ── */}
      {view === "map" && (
        <div style={{ height: "calc(100svh - 200px)", margin: "0 0 0 0" }}>
          <VendorMap
            vendors={filtered.map(shape)}
            customerCoords={coords}
            onVendorSelect={v => navigate("vendor", v)}
          />
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <>
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

          {/* Category pills */}
          <section className="section">
            <div className="categories-scroll">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-pill ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.emoji}</span><span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Popular section */}
          {activeCategory === 1 && !search && (
            <section className="section">
              <div className="section-header"><h2>🔥 Popular Right Now</h2></div>
              <div className="popular-scroll">
                {popularMeals.map(meal => (
                  <div
                    key={meal.id}
                    className="popular-card"
                    onClick={() => {
                      const v = vendors.find(v => v.id === meal.vendorId);
                      if (v) navigate("vendor", shape(v));
                    }}
                  >
                    <span className="popular-emoji">{meal.image}</span>
                    <p className="popular-name">{meal.name}</p>
                    <p className="popular-vendor">{meal.vendorName}</p>
                    <div className="popular-bottom">
                      <span className="popular-price">{fmt(meal.price)}</span>
                      <span className="popular-rating">⭐ {meal.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Restaurants list */}
          <section className="section">
            <div className="section-header">
              <h2>{search ? `Results for "${search}"` : "🏪 Nearby Restaurants"}</h2>
              <span className="section-count">{loading ? "..." : `${filtered.length} places`}</span>
            </div>
            {loading ? (
              <div className="empty-state"><p>Loading restaurants...</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><p>😕 No results</p><span>Try a different search</span></div>
            ) : (
              <div className="vendors-list">
                {filtered.map(raw => {
                  const v = shape(raw);
                  return (
                    <div key={v.id} className="vendor-card" onClick={() => navigate("vendor", v)}>
                      {v.cover_image_url ? (
                        <div className="vendor-img" style={{ padding: 0, overflow: "hidden" }}>
                          <img src={v.cover_image_url} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {v.tag && <span className="vendor-tag" style={{ background: v.tagColor }}>{v.tag}</span>}
                        </div>
                      ) : (
                        <div className="vendor-img">
                          <span>{v.image}</span>
                          {v.tag && <span className="vendor-tag" style={{ background: v.tagColor }}>{v.tag}</span>}
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
                          <span>⏱ {v.deliveryTime}</span>
                          <span>🛵 {fmt(v.deliveryFee)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <div style={{ height: 20 }} />
        </>
      )}
    </div>
  );
}
