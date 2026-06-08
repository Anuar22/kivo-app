import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext.jsx";
import { vendorsApi } from "../api/index.js";

function MenuItem({ item, vendor, addItem, getQty, removeItem }) {
  const qty = getQty(item.id);
  return (
    <div className="menu-item">
      <div className="menu-item-emoji">{item.image}</div>
      <div className="menu-item-info">
        <div className="menu-item-top">
          <h4>{item.name}</h4>
          {item.popular && <span className="popular-badge">Popular</span>}
        </div>
        <p>{item.description}</p>
        <div className="menu-item-bottom">
          <span className="menu-item-price">${Number(item.price).toFixed(2)}</span>
          {qty === 0 ? (
            <button className="add-btn" onClick={() => addItem(item, vendor)}>+ Add</button>
          ) : (
            <div className="qty-control">
              <button onClick={() => removeItem(item.id)}>−</button>
              <span>{qty}</span>
              <button onClick={() => addItem(item, vendor)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorPage({ vendor }) {
  const { addItem, getQty, removeItem } = useCart();
  const [tab, setTab]     = useState("menu");
  const [menu, setMenu]   = useState(vendor?.menu || []);
  const [loading, setLoading] = useState(!vendor?.menu);

  useEffect(() => {
    if (!vendor) return;
    // Fetch fresh menu from API
    vendorsApi.get(vendor.id)
      .then(({ menu }) => setMenu(menu))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendor?.id]);

  if (!vendor) return null;

  const popular = menu.filter(i => i.popular);

  const SAMPLE_REVIEWS = [
    { name: "John M.", rating: 5, text: "Absolutely amazing food! Always fresh and delivered hot.", time: "2 days ago" },
    { name: "Amina K.", rating: 5, text: "Quick delivery and the food was still hot. Will order again!", time: "5 days ago" },
    { name: "David O.", rating: 4, text: "Great flavors, portions could be bigger but overall great.", time: "1 week ago" },
  ];

  const tagColor = vendor.tag_color ?? vendor.tagColor ?? "#ff6b35";
  const deliveryFee = Number(vendor.delivery_fee ?? vendor.deliveryFee ?? 2);
  const deliveryTime = vendor.delivery_time ?? vendor.deliveryTime ?? "20–35 min";
  const reviews = vendor.review_count ?? vendor.reviews ?? 0;

  return (
    <div className="page vendor-page">
      <div className="vendor-hero">
        <div className="vendor-hero-art">{vendor.image}</div>
        <div className="vendor-hero-overlay">
          <span className="vendor-hero-tag" style={{ background: tagColor }}>{vendor.tag}</span>
          <h2>{vendor.name}</h2>
          <p>{vendor.description}</p>
          <div className="vendor-hero-meta">
            <span>⭐ {vendor.rating} ({reviews})</span>
            <span>⏱ {deliveryTime}</span>
            <span>🛵 ${deliveryFee.toFixed(2)} delivery</span>
          </div>
        </div>
      </div>

      <div className="vendor-tabs">
        {["menu", "reviews"].map(t => (
          <button key={t} className={`vtab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "menu" && (
        <div className="menu-content">
          {loading ? (
            <div className="empty-state"><p>Loading menu...</p></div>
          ) : (
            <>
              {popular.length > 0 && (
                <div className="menu-section">
                  <h3 className="menu-section-title">⭐ Popular Items</h3>
                  {popular.map(item => (
                    <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
                  ))}
                </div>
              )}
              <div className="menu-section">
                <h3 className="menu-section-title">📋 Full Menu</h3>
                {menu.map(item => (
                  <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="reviews-score">{vendor.rating}</div>
            <div>
              <div className="reviews-stars">{"⭐".repeat(Math.round(Number(vendor.rating)))}</div>
              <p>{reviews} reviews</p>
            </div>
          </div>
          {SAMPLE_REVIEWS.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-header">
                <div className="review-avatar">{r.name[0]}</div>
                <div><p className="review-name">{r.name}</p><p className="review-time">{r.time}</p></div>
                <span className="review-rating">{"⭐".repeat(r.rating)}</span>
              </div>
              <p className="review-text">{r.text}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 90 }} />
    </div>
  );
}
