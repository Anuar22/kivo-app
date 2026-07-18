import { useCart } from "../context/CartContext.jsx";

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    back: (
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.2 11.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20 8H6" />
      </>
    ),
    orders: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export function Navbar({ screen, navigate }) {
  const { count } = useCart();

  const titles = {
    vendor: "Restaurant",
    cart: "My Cart",
    orders: "Orders",
    profile: "Profile",
    following: "Following",
  };

  // Hides the global navbar on these screens since they handle their own layout headers
  if (["home", "profile", "orders", "following", "cart", "vendor"].includes(screen)) return null;

  return (
    <header className="navbar">
      <button className="nav-btn" onClick={() => navigate("home")} aria-label="Go home">
        <Icon name="back" />
      </button>

      <h2 className="nav-title">{titles[screen] || "Kivo"}</h2>

      {screen === "cart" ? (
        <div style={{ width: 44 }} />
      ) : (
        <button
          className="nav-btn"
          onClick={() => navigate("cart")}
          style={{ position: "relative" }}
          aria-label="Open cart"
        >
          <Icon name="cart" />

          {count > 0 && <span className="cart-badge">{count}</span>}
        </button>
      )}
    </header>
  );
}

export function BottomNav({ screen, navigate }) {
  const { count } = useCart();

  if (screen === "cart") return null;

  const tabs = [
    { id: "home", label: "Home", icon: "home" },
    { id: "following", label: "Following", icon: "heart" },
    { id: "cart", label: "Cart", icon: "cart", fab: true },
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "profile", label: "Profile", icon: "profile" },
  ];

  return (
    <nav className="bottom-nav-v2" aria-label="Primary navigation">
      {tabs.map((tab) => {
        if (tab.fab) {
          return (
            <button
              key={tab.id}
              className="bnv2-fab"
              onClick={() => navigate("cart")}
              aria-label="Open cart"
            >
              <span className="bnv2-fab-icon">
                <Icon name={tab.icon} size={24} />
              </span>

              {count > 0 && <span className="bnv2-fab-badge">{count}</span>}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`bnv2-tab ${screen === tab.id ? "active" : ""}`}
            aria-label={tab.label}
            aria-current={screen === tab.id ? "page" : undefined}
          >
            <span className="bnv2-icon">
              <Icon name={tab.icon} size={21} />
            </span>

            <span className="bnv2-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}