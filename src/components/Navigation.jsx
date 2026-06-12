import { useCart } from "../context/CartContext.jsx";

export function Navbar({ screen, navigate }) {
  const { count } = useCart();
  const titles = { vendor: "Restaurant", cart: "My Cart", orders: "My Orders", profile: "Profile" };

  if (screen === "home" || screen === "profile" || screen === "orders") return null; // these have their own headers

  return (
    <nav className="navbar">
      <div className="nav-inner nav-page">
        <button className="nav-back" onClick={() => navigate("home")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="nav-title">{titles[screen]}</span>
        {screen === "cart" ? (
          <div style={{ width: 36 }} />
        ) : (
          <button className="nav-icon-btn" onClick={() => navigate("cart")} style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
        )}
      </div>
    </nav>
  );
}

export function BottomNav({ screen, navigate }) {
  const { count } = useCart();

  const left = [
    {
      id: "home", label: "Home",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#e53935" : "none"} stroke={active ? "#e53935" : "#bbb"} strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: "profile", label: "Profile",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#e53935" : "none"} stroke={active ? "#e53935" : "#bbb"} strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  const right = [
    {
      id: "orders", label: "Orders",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#e53935" : "#bbb"} strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="2"/>
          <path d="M9 12h6M9 16h4"/>
        </svg>
      ),
    },
    {
      id: "cart", label: "Favourites",
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#e53935" : "none"} stroke={active ? "#e53935" : "#bbb"} strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav-v2">
      {/* Left tabs */}
      {left.map(tab => (
        <button
          key={tab.id}
          className={`bnv2-tab ${screen === tab.id ? "active" : ""}`}
          onClick={() => navigate(tab.id)}
        >
          {tab.icon(screen === tab.id)}
          <span>{tab.label}</span>
        </button>
      ))}

      {/* Centre FAB */}
      <div className="bnv2-fab-wrap">
        <button className="bnv2-fab" onClick={() => navigate("cart")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          {count > 0 && <span className="bnv2-fab-badge">{count}</span>}
        </button>
      </div>

      {/* Right tabs */}
      {right.map(tab => (
        <button
          key={tab.id}
          className={`bnv2-tab ${screen === tab.id ? "active" : ""}`}
          onClick={() => navigate(tab.id)}
        >
          {tab.icon(screen === tab.id)}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
