import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories, popularMeals } from "../data/index.js";
import { fmt } from "../utils/currency.js";
import { useCart } from "../context/CartContext.jsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function useCustomerLocation() {
  const [coords, setCoords] = useState(() => {
    try { const s = sessionStorage.getItem("kivo_coords"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [denied, setDenied] = useState(false);
  const [hardBlocked, setHardBlocked] = useState(false);
  const [asking, setAsking] = useState(false);

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

export default function Home({ navigate }) {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set(JSON.parse(localStorage.getItem("kivo_favorites") || "[]")));
  const { coords, denied, hardBlocked, asking, request } = useCustomerLocation();

  useEffect(() => {
    vendorsApi.list(null, coords)
      .then(({ vendors }) => setVendors(vendors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords]);

  const shape = (v) => ({
    ...v,
    deliveryFee: Number(v.delivery_fee ?? v.deliveryFee ?? 2),
    deliveryTime: v.delivery_time ?? v.deliveryTime ?? "20–35 min",
    tagColor: v.tag_color ?? v.tagColor ?? "#e53935",
    reviewCount: v.review_count ?? v.reviews ?? 0,
  });

  const toggleFavorite = (itemKey) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemKey)) {
      newFavorites.delete(itemKey);
    } else {
      newFavorites.add(itemKey);
    }
    setFavorites(newFavorites);
    localStorage.setItem("kivo_favorites", JSON.stringify([...newFavorites]));
  };

  // Get all food items across vendors
  const allItems = vendors.flatMap(vendor => 
    vendor.menu.map(item => ({
      ...item,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCategory: vendor.category,
      vendorImage: vendor.image,
    }))
  );

  // Filter items
  const catName = categories.find(c => c.id === activeCategory)?.name;
  const filtered = allItems.filter(item => {
    const matchCat = activeCategory === 1 || item.vendorCategory === catName;
    const matchSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page home-page">
      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="hero-top-row">
          <div>
            <div className="hero-badge">⚡ Live food near you</div>
            <p className="greeting-sub">Good afternoon 👋</p>
            <h1 className="greeting-main">
              Find your <br /><em>food now</em>
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search food or restaurant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="clear-search" onClick={() => setSearch("")}>✕</button>}
          </div>

          {/* Location button */}
          <button
            onClick={() => {
              if (!coords && !denied) request();
            }}
            style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: coords ? "#e53935" : "rgba(255,255,255,0.15)",
              border: coords ? "none" : "1.5px solid rgba(255,255,255,0.3)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
              boxShadow: coords ? "0 4px 12px rgba(229,57,53,0.4)" : "none",
            }}
            title="Enable location"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
        </div>

        {coords && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span> Showing restaurants near you
          </p>
        )}
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
                  Go to browser Settings → Site permissions → Location → allow Kivo.
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

      {/* ── Promo banner ── */}
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

      {/* ── Category pills ── */}
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

      {/* ── Food items grid ── */}
      <section className="section" style={{ padding: "0 0 8px" }}>
        <div style={{ padding: "0 16px 12px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, margin: 0 }}>
            {search ? `🔍 Results for "${search}"` : "🍽️ What's cooking"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.4 }}>
            {activeCategory === 1 ? "All the latest dishes from nearby" : `${categories.find(c => c.id === activeCategory)?.name || ""} items`}
          </p>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading menu...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>😕 No items found</p><span>Try a different search or category</span></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px", marginBottom: 8 }}>
            {filtered.map(item => (
              <div
                key={`${item.vendorId}-${item.id}`}
                style={{
                  background: "var(--card)",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={() => navigate("vendor", shape(vendors.find(v => v.id === item.vendorId)))}
              >
                {/* Image */}
                <div
                  style={{
                    height: 100,
                    background: "linear-gradient(135deg, #f0ede8, #e8e4df)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    fontSize: 36,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {item.image}
                  {/* Heart icon */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(`${item.vendorId}-${item.id}`);
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "white",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}
                  >
                    {favorites.has(`${item.vendorId}-${item.id}`) ? "❤️" : "🤍"}
                  </button>
                </div>
                {/* Content */}
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, marginBottom: 2, color: "var(--on-surface)" }}>{item.name}</h4>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, marginBottom: 6, lineHeight: 1.3 }}>{item.vendorName}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span style={{ fontWeight: 700, color: "var(--orange)", fontSize: 14 }}>{fmt(item.price)}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const vendor = vendors.find(v => v.id === item.vendorId);
                        if (vendor) {
                          addItem(item, shape(vendor));
                        }
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "var(--orange)",
                        border: "none",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div style={{ height: 20 }} />
    </div>
  );
}
