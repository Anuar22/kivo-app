import { useAccount } from "../context/useAccount.js";

const PROFILE_SECTIONS = [
  { title: "Account", items: [{ icon: "👤", label: "Edit Profile" }, { icon: "📍", label: "Saved Addresses" }, { icon: "💳", label: "Payment Methods" }] },
  { title: "Activity", items: [{ icon: "📦", label: "Order History" }, { icon: "❤️", label: "Favourite Restaurants" }, { icon: "⭐", label: "My Reviews" }] },
  { title: "Support", items: [{ icon: "💬", label: "Help & Support" }, { icon: "📄", label: "Terms & Privacy" }, { icon: "🔔", label: "Notifications" }] },
];

export default function Profile() {
  const { user, logout } = useAccount();
  const stats = { orders: 14, saved: 3 };

  return (
    <div className="page profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{user.name[0]}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.phone}</p>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-num">{stats.orders}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="stat-num">{stats.saved}</span>
          <span className="stat-label">Saved</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="stat-num">{user.role === "vendor" ? "🏪" : "👤"}</span>
          <span className="stat-label">{user.role}</span>
        </div>
      </div>

      {PROFILE_SECTIONS.map(s => (
        <div key={s.title} className="profile-section">
          <p className="profile-section-title">{s.title}</p>
          <div className="profile-list">
            {s.items.map(item => (
              <button key={item.label} className="profile-item">
                <span className="profile-item-icon">{item.icon}</span>
                <span className="profile-item-label">{item.label}</span>
                <span className="profile-item-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="logout-btn" onClick={logout}>Sign Out</button>
      <div style={{ height: 20 }} />
    </div>
  );
}
