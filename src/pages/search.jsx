import { useState, useEffect, useRef } from "react";
import { vendorsApi } from "../api/index.js";
import { categories } from "../data/index.js";
import { fmt } from "../utils/currency.js";

const RECENT_KEY = "kivo_recent_searches";

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
}
function saveRecent(term) {
  const list = [term, ...loadRecent().filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  return list;
}

export default function Search({ navigate }) {
  const [query, setQuery]     = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState({ vendors: [], items: [] });
  const [searching, setSearching] = useState(false);
  const [trending, setTrending]   = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [recent, setRecent]   = useState(loadRecent());
  const [categoryName, setCategoryName]   = useState(null);
  const [categoryVendors, setCategoryVendors] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    vendorsApi.popularItems(12)
      .then(({ items }) => {
        const seen = new Set();
        const unique = [];
        for (const item of items) {
          const key = item.name.toLowerCase();
          if (!seen.has(key)) { seen.add(key); unique.push(item); }
        }
        setTrending(unique.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []);

  // Debounce typing before firing a search request
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) { setResults({ vendors: [], items: [] }); return; }
    setCategoryName(null);
    setSearching(true);
    vendorsApi.search(debounced)
      .then(res => {
        setResults(res);
        setRecent(saveRecent(debounced));
      })
      .catch(() => setResults({ vendors: [], items: [] }))
      .finally(() => setSearching(false));
  }, [debounced]);

  const openCategory = (name) => {
    setQuery("");
    setCategoryName(name);
    setCategoryLoading(true);
    vendorsApi.list(name)
      .then(({ vendors }) => setCategoryVendors(vendors))
      .catch(() => setCategoryVendors([]))
      .finally(() => setCategoryLoading(false));
  };

  const openVendor = (vendor) => navigate("vendor", vendor);

  const openItem = async (item) => {
    try {
      const { vendor } = await vendorsApi.get(item.vendor_id);
      navigate("vendor", vendor);
    } catch {
      // fall back to whatever partial data we have rather than dead-ending
      navigate("vendor", { id: item.vendor_id, name: item.vendor_name, category: item.category, rating: item.rating });
    }
  };

  const clearingBack = () => {
    if (categoryName) { setCategoryName(null); return; }
    if (query) { setQuery(""); return; }
    navigate("home");
  };

  const showBrowse = !query && !categoryName;
  const showCategoryList = !query && categoryName;
  const showSearchResults = !!query;

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#ffffff", paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "#000000", borderBottom: "1px solid #141414", padding: "calc(var(--sat) + 12px) 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={clearingBack} style={{ background: "none", border: "none", color: "#ffffff", padding: 4, cursor: "pointer", display: "flex" }} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#1a1a1a", border: "1px solid #222222", borderRadius: 12, padding: "11px 14px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search dishes, restaurants, cuisines…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: 14, fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 15, padding: 0 }} aria-label="Clear">✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {showBrowse && (
          <>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Recent searches</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {recent.map((term, i) => (
                    <button key={i} onClick={() => setQuery(term)} style={{ background: "#121212", border: "1px solid #222222", color: "#d0d0d0", borderRadius: 100, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      🕘 {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / most loved */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>🔥 Most loved right now</h3>
              {trendingLoading ? (
                <p style={{ color: "#666666", fontSize: 13 }}>Loading…</p>
              ) : trending.length === 0 ? (
                <p style={{ color: "#666666", fontSize: 13 }}>Nothing trending just yet — check back soon.</p>
              ) : (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {trending.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setQuery(item.name)}
                      style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", width: 78 }}
                    >
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: "#121212", border: "1px solid #222222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, overflow: "hidden" }}>
                        {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (item.image || "🍽️")}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#d0d0d0", textAlign: "center", lineHeight: 1.2 }}>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Categories grid */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Browse by category</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {categories.filter(c => c.name !== "All").map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => openCategory(cat.name)}
                    style={{ background: "#121212", border: "1px solid #222222", borderRadius: 14, padding: "18px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 26 }}>{cat.emoji}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {showCategoryList && (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>{categoryName} restaurants</h3>
            {categoryLoading ? (
              <p style={{ color: "#666666", fontSize: 13 }}>Loading…</p>
            ) : categoryVendors.length === 0 ? (
              <p style={{ color: "#666666", fontSize: 13 }}>No {categoryName.toLowerCase()} restaurants nearby yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categoryVendors.map(v => <VendorRow key={v.id} vendor={v} onClick={() => openVendor(v)} />)}
              </div>
            )}
          </>
        )}

        {showSearchResults && (
          <>
            {searching && <p style={{ color: "#666666", fontSize: 13 }}>Searching…</p>}

            {!searching && results.vendors.length === 0 && results.items.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "#a0a0a0", fontWeight: 600, margin: "0 0 4px" }}>😕 No results for "{query}"</p>
                <span style={{ color: "#666666", fontSize: 13 }}>Try a different dish, restaurant, or cuisine</span>
              </div>
            )}

            {results.vendors.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Restaurants</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {results.vendors.map(v => <VendorRow key={v.id} vendor={v} onClick={() => openVendor(v)} />)}
                </div>
              </div>
            )}

            {results.items.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Dishes</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {results.items.map(item => (
                    <button key={item.id} onClick={() => openItem(item)} style={{ display: "flex", alignItems: "center", gap: 12, background: "#121212", border: "1px solid #222222", borderRadius: 14, padding: 10, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden", flexShrink: 0 }}>
                        {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (item.image || "🍽️")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#ffffff" }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "#a0a0a0" }}>{item.vendor_name}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", flexShrink: 0 }}>{fmt(item.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VendorRow({ vendor, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, background: "#121212", border: "1px solid #222222", borderRadius: 14, padding: 10, cursor: "pointer", textAlign: "left" }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, overflow: "hidden", flexShrink: 0 }}>
        {vendor.image || "🍽️"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#ffffff" }}>{vendor.name}</div>
        <div style={{ fontSize: 12, color: "#a0a0a0" }}>{vendor.category}</div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>⭐ {Number(vendor.review_count) > 0 ? Number(vendor.rating).toFixed(1) : "New"}</div>
    </button>
  );
}