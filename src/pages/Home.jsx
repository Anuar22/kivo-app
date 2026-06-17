import { useState, useEffect } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import VendorMap from "../components/VendorMap.jsx";

function useCustomerLocation() {
  const [coords, setCoords] = useState(() => {
    try { const s = sessionStorage.getItem("kivo_coords"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  const request = () => {
    if (!navigator.geolocation || asking) return;
    setAsking(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        sessionStorage.setItem("kivo_coords", JSON.stringify(c));
        setCoords(c); setAsking(false);
      },
      () => { setDenied(true); setAsking(false); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  useEffect(() => { if (!coords && !denied) request(); }, []);
  return { coords, asking, denied, request };
}

function HeartBtn({ filled, onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", bottom: 10, right: 10,
        background: "white", border: "none", borderRadius: "50%",
        width: 30, height: 30, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 14,
      }}
    >
      {filled ? "❤️" : "🤍"}
    </button>
  );
}

export default function Home({ navigate }) {
  const [view, setView]             = useState("list");
  const [search, setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState(0); // 0 = All
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [favourites, setFavourites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("kivo_favs") || "[]")); }
    catch { return new Set(); }
  });
  const { coords, denied, request } = useCustomerLocation();

  useEffect(() => {
    setLoading(true);
    const catName = activeCategory === 0 ? null : categories[activeCategory]?.name;
    vendorsApi.list(catName, coords)
      .then(({ vendors }) => setVendors(vendors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, coords]);

  const toggleFav = (id) => {
    setFavourites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("kivo_favs", JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = vendors.filter(v => {
    if (!search) return true;
    return (
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? v.deliveryFee  ?? 2),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor:     v.tag_color ?? v.tagColor ?? "#e53935",
    reviewCount:  v.review_count ?? v.reviews ?? 0,
  });

  // Category pills — "All" first then from data
  const allCategories = [{ name: "All", emoji: "" }, ...categories];

  return (
    <div className="home-v2">

      {/* ── Header ── */}
      <div className="hv2-header">
        <div>
          <div className="hv2-logo">Kivo</div>
          <p className="hv2-tagline">
            {coords ? "📍 Showing nearby restaurants" : "Order your favourite food!"}
          </p>
        </div>
        <div className="hv2-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="hv2-search-row">
        <div className="hv2-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 14, padding: 0 }}>✕</button>
          )}
        </div>
        <button
          className="hv2-filter-btn"
          onClick={() => setView(v => v === "map" ? "list" : "map")}
          title="Toggle map"
        >
          {view === "map"
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          }
        </button>
      </div>

      {/* ── Location denied nudge ── */}
      {denied && !coords && (
        <div className="hv2-nudge">
          <span>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Enable location for nearby results</p>
            <p style={{ fontSize: 12, color: "#999", marginTop: 1 }}>We'll show closest restaurants first</p>
          </div>
          <button className="hv2-nudge-btn" onClick={request}>Allow</button>
        </div>
      )}

      {/* ── Category pills ── */}
      <div className="hv2-cats">
        {allCategories.map((cat, i) => (
          <button
            key={i}
            className={`hv2-cat ${activeCategory === i ? "active" : ""}`}
            onClick={() => setActiveCategory(i)}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* ── Map view ── */}
      {view === "map" && (
        <div style={{ margin: "0 16px 16px", height: 360, borderRadius: 16, overflow: "hidden", border: "1.5px solid #eee" }}>
          <VendorMap
            vendors={filtered}
            customerCoords={coords}
            onVendorSelect={v => navigate("vendor", shape(v))}
          />
        </div>
      )}

      {/* ── Grid view ── */}
      {view === "list" && (
        <div style={{ padding: "0 16px 100px" }}>

          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#0f0f0f" }}>
              {search ? `Results for "${search}"` : activeCategory === 0 ? "Restaurants Near You" : allCategories[activeCategory].name}
            </p>
            {!loading && (
              <span style={{ fontSize: 12, color: "#aaa" }}>{filtered.length} places</span>
            )}
          </div>

          {loading ? (
            /* Skeleton cards */
            <div className="hv2-grid">
              {[1,2,3,4].map(n => (
                <div key={n} className="hv2-skeleton">
                  <div className="hv2-skel-img" />
                  <div style={{ padding: "10px 10px 12px" }}>
                    <div className="hv2-skel-line" style={{ width: "70%", height: 13, marginBottom: 6 }} />
                    <div className="hv2-skel-line" style={{ width: "50%", height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>😕</div>
              <p style={{ fontWeight: 600, color: "#555" }}>No restaurants found</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try a different search or category</p>
            </div>
          ) : (
            <div className="hv2-grid">
              {filtered.map(raw => {
                const v = shape(raw);
                return (
                  <div key={v.id} className="hv2-card" onClick={() => navigate("vendor", v)}>
                    {/* Food image area */}
                    <div className="hv2-card-img">
                      {v.cover_image_url ? (
                        <img src={v.cover_image_url} alt={v.name} className="hv2-card-photo" />
                      ) : (
                        <span className="hv2-card-emoji">{v.image || "🍽️"}</span>
                      )}
                      {v.tag && (
                        <span className="hv2-card-badge" style={{ background: v.tagColor }}>
                          {v.tag}
                        </span>
                      )}
                      <HeartBtn
                        filled={favourites.has(v.id)}
                        onClick={() => toggleFav(v.id)}
                      />
                    </div>
                    {/* Card info */}
                    <div className="hv2-card-body">
                      <p className="hv2-card-name">{v.name}</p>
                      <p className="hv2-card-cat">{v.category || "Restaurant"}</p>
                      <div className="hv2-card-meta">
                        <span className="hv2-card-rating">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          {v.rating}
                        </span>
                        {v.distance && v.distance !== "—" && (
                          <span className="hv2-card-dist">{v.distance}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
