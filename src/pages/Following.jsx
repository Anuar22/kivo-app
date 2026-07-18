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
    deliveryFee:  Number(v.delivery_fee  ?? 2000),
    deliveryTime: v.delivery_time ?? "20–35 min",
    tagColor:     v.tag_color ?? "#e53935",
    reviewCount:  v.review_count ?? 0,
  });

  return (
    <div className="home-v2" style={{ background: "#000000", minHeight: "100vh", color: "#ffffff" }}>
      {/* ── Header Area ── */}
      <div className="hv2-header" style={{ padding: "16px 16px 8px" }}>
        <div>
          <div className="hv2-logo" style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", fontFamily: "var(--font-heading)" }}>Following</div>
          <p className="hv2-tagline" style={{ fontSize: "12px", color: "#666666", marginTop: "4px" }}>
            Vendors you follow get a 🔔 when they post something new
          </p>
        </div>
      </div>

      {/* ── Premium Description Frame ── */}
      <div className="screen-card-soft" style={{ margin: "8px 16px 14px", padding: "14px", background: "#121212", border: "1px solid #1a1a1a", borderRadius: "14px" }}>
        <div className="screen-title" style={{ color: "#e53935", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your favorites</div>
        <div className="screen-subtitle" style={{ marginTop: "6px", fontSize: "12px", color: "#a0a0a0", lineHeight: "1.4" }}>
          Keep track of the restaurants you love and jump back in quickly whenever you want to order.
        </div>
      </div>

      <div style={{ padding: "8px 16px 100px" }}>
        {loading ? (
          <div className="hv2-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {[1, 2].map(n => (
              <div key={n} className="hv2-skeleton" style={{ background: "#121212", borderRadius: "14px", overflow: "hidden", border: "1px solid #1a1a1a" }}>
                <div className="hv2-skel-img" style={{ height: "110px", background: "#1a1a1a" }} />
                <div style={{ padding: "10px" }}>
                  <div className="hv2-skel-line" style={{ width: "70%", height: "12px", marginBottom: "6px", background: "#222222", borderRadius: "4px" }} />
                  <div className="hv2-skel-line" style={{ width: "50%", height: "10px", background: "#222222", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          /* ── Empty State Map Canvas ── */
          <div className="screen-card" style={{ textAlign: "center", padding: "40px 20px", background: "#121212", border: "1px solid #1a1a1a", borderRadius: "16px", marginTop: "12px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤍</div>
            <p style={{ fontWeight: "800", color: "#ffffff", fontSize: "15px", marginBottom: "6px" }}>You're not following anyone yet</p>
            <p style={{ fontSize: "12px", color: "#666666", lineHeight: "1.5", maxWidth: "240px", margin: "0 auto" }}>
              Tap the heart on a restaurant storefront card frame to follow it and get real-time tracking updates.
            </p>
          </div>
        ) : (
          /* ── Vendor Grid Items ── */
          <div className="hv2-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {vendors.map(raw => {
              const v = shape(raw);
              return (
                <div 
                  key={v.id} 
                  className="hv2-card" 
                  onClick={() => navigate("vendor", v)}
                  style={{ background: "#121212", borderRadius: "14px", overflow: "hidden", border: "1px solid #1a1a1a", position: "relative", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                >
                  <div className="hv2-card-img" style={{ height: "110px", background: "#000000", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {v.cover_image_url ? (
                      <img src={v.cover_image_url} alt={v.name} className="hv2-card-photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="hv2-card-emoji" style={{ fontSize: "32px" }}>{v.image || "🍽️"}</span>
                    )}
                    <button
                      onClick={e => unfollow(e, v.id)}
                      title="Unfollow"
                      style={{
                        position: "absolute", bottom: 8, right: 8,
                        background: "rgba(0, 0, 0, 0.75)", border: "1px solid #222222", borderRadius: "50%",
                        width: 30, height: 30, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                        fontSize: 13, transition: "transform 0.15s ease",
                      }}
                    >
                      ❤️
                    </button>
                  </div>
                  <div className="hv2-card-body" style={{ padding: "10px 12px" }}>
                    <p className="hv2-card-name" style={{ fontWeight: "700", fontSize: "13px", color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</p>
                    <p className="hv2-card-cat" style={{ fontSize: "11px", color: "#666666", margin: "2px 0 6px" }}>{v.category || "Restaurant"}</p>
                    <div className="hv2-card-meta" style={{ display: "flex", alignItems: "center" }}>
                      <span className="hv2-card-rating" style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "700", color: "#f59e0b" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {v.rating || "5.0"}
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