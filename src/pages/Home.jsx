import { useState } from "react";
import { categories, vendors, popularMeals } from "../data/index.js";

export default function Home({ navigate }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(1);

  const filtered = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 1 || v.category === categories.find(c => c.id === activeCategory)?.name;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page home-page">
      <div className="home-hero">
        <p className="greeting-sub">Good afternoon 👋</p>
        <h1 className="greeting-main">What are you <br /><em>craving today?</em></h1>
        <div className="search-bar">
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
      </div>

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

      {activeCategory === 1 && !search && (
        <section className="section">
          <div className="section-header"><h2>🔥 Popular Right Now</h2></div>
          <div className="popular-scroll">
            {popularMeals.map(meal => (
              <div
                key={meal.id}
                className="popular-card"
                onClick={() => navigate("vendor", vendors.find(v => v.id === meal.vendorId))}
              >
                <span className="popular-emoji">{meal.image}</span>
                <p className="popular-name">{meal.name}</p>
                <p className="popular-vendor">{meal.vendorName}</p>
                <div className="popular-bottom">
                  <span className="popular-price">${meal.price.toFixed(2)}</span>
                  <span className="popular-rating">⭐ {meal.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h2>{search ? `Results for "${search}"` : "🏪 Nearby Restaurants"}</h2>
          <span className="section-count">{filtered.length} places</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><p>😕 No results</p><span>Try a different search</span></div>
        ) : (
          <div className="vendors-list">
            {filtered.map(v => (
              <div key={v.id} className="vendor-card" onClick={() => navigate("vendor", v)}>
                <div className="vendor-img">
                  <span>{v.image}</span>
                  <span className="vendor-tag" style={{ background: v.tagColor }}>{v.tag}</span>
                </div>
                <div className="vendor-info">
                  <div className="vendor-header">
                    <h3>{v.name}</h3>
                    <span className="vendor-rating">⭐ {v.rating}</span>
                  </div>
                  <p className="vendor-category">{v.category}</p>
                  <div className="vendor-meta">
                    <span>📍 {v.distance}</span>
                    <span>⏱ {v.deliveryTime}</span>
                    <span>🛵 ${v.deliveryFee.toFixed(2)}</span>
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
