import { useState } from "react";
import { useCart } from "../context/useCart.js";

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
          <span className="menu-item-price">${item.price.toFixed(2)}</span>
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

const SAMPLE_REVIEWS = [
  { name: "John M.", rating: 5, text: "Absolutely amazing food! The nyama choma was perfectly cooked.", time: "2 days ago" },
  { name: "Amina K.", rating: 5, text: "Quick delivery and the food was still hot. Will order again!", time: "5 days ago" },
  { name: "David O.", rating: 4, text: "Great flavors, portions could be bigger but overall great.", time: "1 week ago" },
];

export default function VendorPage({ vendor }) {
  const { addItem, getQty, removeItem } = useCart();
  const [tab, setTab] = useState("menu");

  if (!vendor) return null;

  return (
    <div className="page vendor-page">
      <div className="vendor-hero">
        <div className="vendor-hero-art">{vendor.image}</div>
        <div className="vendor-hero-overlay">
          <span className="vendor-hero-tag" style={{ background: vendor.tagColor }}>{vendor.tag}</span>
          <h2>{vendor.name}</h2>
          <p>{vendor.description}</p>
          <div className="vendor-hero-meta">
            <span>⭐ {vendor.rating} ({vendor.reviews})</span>
            <span>⏱ {vendor.deliveryTime}</span>
            <span>🛵 ${vendor.deliveryFee.toFixed(2)} delivery</span>
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
          {vendor.menu.filter(i => i.popular).length > 0 && (
            <div className="menu-section">
              <h3 className="menu-section-title">⭐ Popular Items</h3>
              {vendor.menu.filter(i => i.popular).map(item => (
                <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
              ))}
            </div>
          )}
          <div className="menu-section">
            <h3 className="menu-section-title">📋 Full Menu</h3>
            {vendor.menu.map(item => (
              <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />
            ))}
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews-content">
          <div className="reviews-summary">
            <div className="reviews-score">{vendor.rating}</div>
            <div>
              <div className="reviews-stars">{"⭐".repeat(Math.round(vendor.rating))}</div>
              <p>{vendor.reviews} reviews</p>
            </div>
          </div>
          {SAMPLE_REVIEWS.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-header">
                <div className="review-avatar">{r.name[0]}</div>
                <div>
                  <p className="review-name">{r.name}</p>
                  <p className="review-time">{r.time}</p>
                </div>
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
