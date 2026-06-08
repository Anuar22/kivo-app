import { useCart } from "../context/CartContext.jsx";

export function Navbar({ screen, navigate }) {
  const { count } = useCart();
  const titles = { home: null, vendor: "Restaurant", cart: "My Cart", orders: "My Orders", profile: "Profile" };

  return (
    <nav className="navbar">
      {screen !== "home" ? (
        <div className="nav-inner nav-page">
          <button className="nav-back" onClick={() => navigate("home")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <span className="nav-title">{titles[screen]}</span>
          <div style={{ width: 36 }} />
        </div>
      ) : (
        <div className="nav-inner nav-home">
          <div className="nav-logo">
            <span className="logo-k">K</span><span className="logo-ivo">ivo</span>
          </div>
          <div className="nav-actions">
            <button className="nav-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="notif-dot" />
            </button>
            <button className="nav-icon-btn" onClick={() => navigate("cart")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export function BottomNav({ screen, navigate }) {
  const tabs = [
    {
      id: "home", label: "Home",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      id: "orders", label: "Orders",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>,
    },
    {
      id: "cart", label: "Cart",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
    },
    {
      id: "profile", label: "Profile",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`bottom-tab ${screen === tab.id ? "active" : ""}`}
          onClick={() => navigate(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
