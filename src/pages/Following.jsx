import { useState, useEffect } from "react";
import { followsApi } from "../api/index.js";

export default function Following({ navigate }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    followsApi.list()
      .then(({ vendors }) => setVendors(vendors))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const unfollow = (e, vendorId) => {
    e.stopPropagation();
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    followsApi.unfollow(vendorId).catch(() => load()); // reload to recover from failure
  };

  const shape = (v) => ({
    ...v,
    deliveryFee:  Number(v.delivery_fee  ?? 2),
    deliveryTime: v.delivery_time ?? "20–35 min",
    tagColor:     v.tag_color ?? "#e53935",
    reviewCount:  v.review_count ?? 0,
  });

  return (
    <div className="home-v2">
      <div className="hv2-header">
        <div>
          <div className="hv2-logo">Following</div>
          <p className="hv2-tagline">Vendors you follow get a 🔔 when they post something new</p>
        </div>
      </div>

      <div style={{ padding: "8px 16px 100px" }}>
        {loading ? (
          <div className="hv2-grid">
            {[1, 2].map(n => (
              <div key={n} className="hv2-skeleton">
                <div className="hv2-skel-img" />
                <div style={{ padding: "10px 10px 12px" }}>
                  <div className="hv2-skel-line" style={{ width: "70%", height: 13, marginBottom: 6 }} />
                  <div className="hv2-skel-line" style={{ width: "50%", height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🤍</div>
            <p style={{ fontWeight: 600, color: "#555" }}>You're not following anyone yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tap the heart on a restaurant to follow it</p>
          </div>
        ) : (
          <div className="hv2-grid">
            {vendors.map(raw => {
              const v = shape(raw);
              return (
                <div key={v.id} className="hv2-card" onClick={() => navigate("vendor", v)}>
                  <div className="hv2-card-img">
                    {v.cover_image_url ? (
                      <img src={v.cover_image_url} alt={v.name} className="hv2-card-photo" />
                    ) : (
                      <span className="hv2-card-emoji">{v.image || "🍽️"}</span>
                    )}
                    <button
                      onClick={e => unfollow(e, v.id)}
                      title="Unfollow"
                      style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "white", border: "none", borderRadius: "50%",
                        width: 30, height: 30, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 14,
                      }}
                    >
                      ❤️
                    </button>
                  </div>
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
