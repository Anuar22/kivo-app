import { useState, useEffect, createContext, useContext } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── DATA ────────────────────────────────────────────────────────────────────
const categories = [
  { id: 1, name: "All", emoji: "🍽️" },
  { id: 2, name: "Burgers", emoji: "🍔" },
  { id: 3, name: "Pizza", emoji: "🍕" },
  { id: 4, name: "Local Food", emoji: "🍛" },
  { id: 5, name: "Drinks", emoji: "🥤" },
  { id: 6, name: "Grills", emoji: "🍖" },
];

const vendors = [
  {
    id: 1, name: "Mama Njeri's Kitchen", category: "Local Food",
    rating: 4.8, reviews: 312, distance: "0.8 km", deliveryTime: "20–30 min", deliveryFee: 1.5,
    image: "🍛", tag: "Top Rated", tagColor: "#ff6b35",
    description: "Authentic East African home cooking. Ugali, nyama choma, sukuma wiki and more.",
    menu: [
      { id: 101, name: "Ugali & Beef Stew", price: 4.50, image: "🍖", description: "Creamy ugali with slow-cooked beef stew", popular: true },
      { id: 102, name: "Nyama Choma Plate", price: 7.00, image: "🥩", description: "Grilled goat with kachumbari and ugali", popular: true },
      { id: 103, name: "Githeri Special", price: 3.00, image: "🫘", description: "Maize & beans with tomatoes and onions", popular: false },
      { id: 104, name: "Sukuma Wiki + Chapati", price: 2.50, image: "🫓", description: "Sautéed collard greens with 3 fresh chapatis", popular: false },
      { id: 105, name: "Pilau Rice", price: 5.00, image: "🍚", description: "Fragrant spiced rice with beef", popular: true },
    ]
  },
  {
    id: 2, name: "Burger Stack", category: "Burgers",
    rating: 4.6, reviews: 198, distance: "1.2 km", deliveryTime: "25–35 min", deliveryFee: 2.0,
    image: "🍔", tag: "Popular", tagColor: "#f59e0b",
    description: "Handcrafted smash burgers made fresh daily. Big flavors, bigger stacks.",
    menu: [
      { id: 201, name: "Classic Smash Burger", price: 6.00, image: "🍔", description: "Double smashed patty, American cheese, pickles", popular: true },
      { id: 202, name: "BBQ Bacon Stack", price: 8.00, image: "🥓", description: "Triple patty with crispy bacon and smoky BBQ sauce", popular: true },
      { id: 203, name: "Spicy Chicken Burger", price: 6.50, image: "🌶️", description: "Crispy chicken with jalapeños and sriracha mayo", popular: false },
      { id: 204, name: "Loaded Fries", price: 3.50, image: "🍟", description: "Thick-cut fries with cheese sauce", popular: false },
      { id: 205, name: "Milkshake", price: 3.00, image: "🥤", description: "Vanilla, chocolate or strawberry", popular: false },
    ]
  },
  {
    id: 3, name: "Nairobi Pizza Co.", category: "Pizza",
    rating: 4.5, reviews: 245, distance: "1.8 km", deliveryTime: "30–45 min", deliveryFee: 2.5,
    image: "🍕", tag: "New", tagColor: "#10b981",
    description: "Neapolitan-style pizzas baked in a wood-fired oven.",
    menu: [
      { id: 301, name: "Margherita", price: 9.00, image: "🍕", description: "San Marzano tomatoes, fresh mozzarella, basil", popular: true },
      { id: 302, name: "Nyama Choma Pizza", price: 12.00, image: "🍖", description: "Goat meat, kachumbari salsa, mozzarella", popular: true },
      { id: 303, name: "Pepperoni Classic", price: 11.00, image: "🫓", description: "Loaded with premium pepperoni", popular: false },
      { id: 304, name: "Veggie Garden", price: 9.50, image: "🥦", description: "Roasted capsicum, mushroom, olives", popular: false },
    ]
  },
  {
    id: 4, name: "Chill & Sip", category: "Drinks",
    rating: 4.7, reviews: 156, distance: "0.5 km", deliveryTime: "10–20 min", deliveryFee: 1.0,
    image: "🥤", tag: "Fast Delivery", tagColor: "#6366f1",
    description: "Fresh juices, smoothies and cold drinks made to order.",
    menu: [
      { id: 401, name: "Tropical Blast", price: 3.50, image: "🥭", description: "Mango, pineapple, passion fruit blend", popular: true },
      { id: 402, name: "Green Detox", price: 4.00, image: "🥬", description: "Spinach, cucumber, apple, ginger, lemon", popular: true },
      { id: 403, name: "Avocado Smoothie", price: 4.50, image: "🥑", description: "Creamy avocado with honey and milk", popular: false },
      { id: 404, name: "Fresh Lemonade", price: 2.50, image: "🍋", description: "Hand-squeezed with mint and ginger", popular: false },
    ]
  },
  {
    id: 5, name: "The Grill House", category: "Grills",
    rating: 4.9, reviews: 421, distance: "2.1 km", deliveryTime: "35–50 min", deliveryFee: 3.0,
    image: "🍖", tag: "Best Seller", tagColor: "#ef4444",
    description: "Premium grilled meats prepared over charcoal. The best nyama in town.",
    menu: [
      { id: 501, name: "Whole Grilled Chicken", price: 14.00, image: "🍗", description: "Marinated overnight, charcoal grilled", popular: true },
      { id: 502, name: "Mixed Grill Platter", price: 18.00, image: "🥩", description: "Beef, chicken and sausage with sauces and sides", popular: true },
      { id: 503, name: "Pork Ribs", price: 16.00, image: "🍖", description: "Slow-cooked fall-off-the-bone ribs", popular: false },
      { id: 504, name: "Grilled Fish", price: 13.00, image: "🐟", description: "Whole tilapia in lemon herb marinade", popular: false },
    ]
  }
];

const popularMeals = [
  { id: "p1", name: "Nyama Choma Plate", vendorId: 1, vendorName: "Mama Njeri's", price: 7.00, image: "🥩", rating: 4.9 },
  { id: "p2", name: "Classic Smash Burger", vendorId: 2, vendorName: "Burger Stack", price: 6.00, image: "🍔", rating: 4.8 },
  { id: "p3", name: "Tropical Blast", vendorId: 4, vendorName: "Chill & Sip", price: 3.50, image: "🥭", rating: 4.7 },
  { id: "p4", name: "Mixed Grill Platter", vendorId: 5, vendorName: "The Grill House", price: 18.00, image: "🥩", rating: 4.9 },
];

// ─── CART CONTEXT ─────────────────────────────────────────────────────────────
const CartCtx = createContext(null);
function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState("");

  const addItem = (item, vendor) => {
    if (vendorId && vendorId !== vendor.id) {
      if (!window.confirm(`Clear cart from ${vendorName} and add from ${vendor.name}?`)) return;
      setItems([]); setVendorId(null);
    }
    if (vendor.id) { setVendorId(vendor.id); setVendorName(vendor.name); }
    setItems(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
      if (updated.length === 0) setVendorId(null);
      return updated;
    });
  };

  const clearCart = () => { setItems([]); setVendorId(null); setVendorName(""); };
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const getQty = (id) => items.find(i => i.id === id)?.qty || 0;

  return (
    <CartCtx.Provider value={{ items, addItem, removeItem, clearCart, total, count, getQty, vendorName }}>
      {children}
    </CartCtx.Provider>
  );
}
const useCart = () => useContext(CartCtx);

// ─── ACCOUNT CONTEXT ─────────────────────────────────────────────────────────
const AccountCtx = createContext(null);

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("kivo_token") || "");
  const [initializing, setInitializing] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    apiRequest("/api/auth/me", { token })
      .then(({ user: freshUser }) => setUser(freshUser))
      .catch(() => {
        localStorage.removeItem("kivo_token");
        setToken("");
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, [token]);

  const completeAuth = ({ user: authedUser, token: sessionToken }) => {
    localStorage.setItem("kivo_token", sessionToken);
    setToken(sessionToken);
    setUser(authedUser);
  };

  const register = async (form) => {
    const data = await apiRequest("/api/auth/register", { method: "POST", body: form });
    completeAuth(data);
  };

  const login = async (form) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: form });
    completeAuth(data);
  };

  const logout = () => {
    localStorage.removeItem("kivo_token");
    setToken("");
    setUser(null);
    setInitializing(false);
  };

  return (
    <AccountCtx.Provider value={{ user, initializing, register, login, logout }}>
      {children}
    </AccountCtx.Provider>
  );
}

const useAccount = () => useContext(AccountCtx);

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --orange: #ff6b35;
    --orange-soft: #fff1ec;
    --black: #0f0f0f;
    --dark: #1a1a1a;
    --card: #ffffff;
    --bg: #f7f5f2;
    --border: #e8e4df;
    --text: #1a1a1a;
    --muted: #7a7065;
    --green: #10b981;
    --green-soft: #d1fae5;
    --red: #ef4444;
    --red-soft: #fee2e2;
    --yellow: #f59e0b;
    --yellow-soft: #fef3c7;
    --radius: 12px;
    --nav-h: 60px;
    --bot-h: 68px;
    --shadow-sm: 0 1px 2px rgba(15,15,15,0.04), 0 8px 20px rgba(15,15,15,0.05);
    --shadow-md: 0 12px 30px rgba(15,15,15,0.11);
  }

  html { background: #ece7df; }
  body {
    font-family: 'DM Sans', sans-serif;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0) 240px),
      var(--bg);
    color: var(--text);
    min-height: 100svh;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  button, input { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  button:focus-visible, input:focus-visible {
    outline: 3px solid rgba(255,107,53,0.28);
    outline-offset: 2px;
  }

  .kivo-root {
    width: 100%; max-width: 420px; margin: 0 auto;
    background: var(--bg); min-height: 100svh;
    position: relative; overflow: hidden;
    box-shadow: 0 0 60px rgba(0,0,0,0.14);
  }

  /* ── ACCOUNT ENTRY ── */
  .auth-screen {
    min-height: 100svh;
    background:
      linear-gradient(145deg, rgba(255,107,53,0.18), rgba(255,255,255,0) 44%),
      linear-gradient(135deg, #141414 0%, #2a190d 100%);
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: white;
  }
  .auth-brand { margin-bottom: 28px; }
  .auth-logo { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; line-height: 1; margin-bottom: 8px; }
  .auth-logo span { color: var(--orange); }
  .auth-brand p { color: rgba(255,255,255,0.62); font-size: 14px; line-height: 1.45; max-width: 310px; }
  .auth-panel {
    background: rgba(255,255,255,0.96);
    color: var(--text);
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 18px 50px rgba(0,0,0,0.26);
  }
  .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--bg); padding: 4px; border-radius: 12px; margin-bottom: 14px; }
  .auth-tab { border: none; border-radius: 9px; padding: 10px; background: transparent; color: var(--muted); font-size: 13px; font-weight: 700; cursor: pointer; }
  .auth-tab.active { background: var(--card); color: var(--text); box-shadow: var(--shadow-sm); }
  .role-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .role-choice button {
    border: 1.5px solid var(--border);
    background: var(--card);
    border-radius: 12px;
    padding: 11px 10px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .role-choice button.active { border-color: var(--orange); color: var(--orange); background: var(--orange-soft); }
  .auth-form { display: flex; flex-direction: column; gap: 10px; }
  .auth-input {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 13px 14px;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    outline: none;
  }
  .auth-input:focus { border-color: var(--orange); background: white; }
  .auth-error {
    background: var(--red-soft);
    color: #991b1b;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 9px 11px;
    font-size: 12px;
    line-height: 1.4;
  }
  .auth-submit {
    border: none;
    border-radius: 13px;
    padding: 14px;
    background: linear-gradient(135deg, #ff6b35, #e55a20);
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 26px rgba(255,107,53,0.3);
  }
  .auth-submit:disabled { opacity: 0.65; cursor: wait; }
  .auth-hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin-top: 12px; }
  .boot-screen { min-height: 100svh; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; }

  /* ── ROLE SWITCHER ── */
  .role-switcher {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; z-index: 200;
    background: rgba(15,15,15,0.96); display: flex; align-items: center;
    padding: 0 16px; height: 36px; gap: 8px;
    backdrop-filter: blur(16px);
  }
  .role-label { font-size: 10px; color: rgba(255,255,255,0.35); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0; }
  .role-btn {
    min-height: 26px; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);
    background: none; color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap;
  }
  .role-btn.active { background: var(--orange); border-color: var(--orange); color: white; box-shadow: 0 6px 16px rgba(255,107,53,0.24); }

  /* ── CUSTOMER LAYOUT ── */
  .navbar {
    position: fixed; top: 36px; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; height: var(--nav-h);
    background: rgba(247,245,242,0.9); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border); z-index: 100;
    display: flex; align-items: center;
  }
  .nav-inner { width: 100%; display: flex; align-items: center; padding: 0 16px; }
  .nav-home { justify-content: space-between; }
  .nav-page { justify-content: space-between; }
  .nav-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; line-height: 1; }
  .logo-k { color: var(--orange); }
  .logo-ivo { color: var(--black); }
  .nav-actions { display: flex; gap: 8px; }
  .nav-icon-btn {
    width: 38px; height: 38px; border-radius: 50%; border: none;
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; position: relative; box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }
  .nav-icon-btn:active, .nav-back:active, .bottom-tab:active, .cat-pill:active, .popular-card:active, .vendor-card:active, .menu-item:active, .profile-item:active, .payment-opt:active { transform: scale(0.98); }
  .notif-dot {
    position: absolute; top: 8px; right: 8px;
    width: 8px; height: 8px; border-radius: 50%; background: var(--orange);
    border: 2px solid var(--bg);
  }
  .cart-badge {
    position: absolute; top: -4px; right: -4px;
    background: var(--orange); color: white; font-size: 10px; font-weight: 700;
    width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .nav-back {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--card); cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .nav-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px; }

  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 420px; height: var(--bot-h);
    background: rgba(247,245,242,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid var(--border); z-index: 100;
    display: flex; align-items: center;
  }
  .bottom-tab {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    min-height: 58px; padding: 8px 0; color: var(--muted); font-size: 11px; font-family: 'DM Sans', sans-serif;
    transition: color 0.2s, transform 0.18s ease; font-weight: 500;
  }
  .bottom-tab.active { color: var(--orange); }
  .bottom-tab svg { transition: transform 0.2s; }
  .bottom-tab.active svg { transform: translateY(-2px); }

  .main-content {
    padding-top: calc(var(--nav-h) + 36px); padding-bottom: var(--bot-h);
    min-height: 100svh; height: 100svh; overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .page { padding: 0; }

  /* ── HOME ── */
  .home-hero {
    background:
      linear-gradient(145deg, rgba(255,107,53,0.18), rgba(255,255,255,0) 42%),
      linear-gradient(135deg, #141414 0%, #2a190d 100%);
    padding: 26px 16px 28px; position: relative; overflow: hidden;
  }
  .home-hero::before {
    content: '🍽️'; position: absolute; top: 18px; right: 18px;
    font-size: 74px; line-height: 1; opacity: 0.12; transform: rotate(-10deg);
  }
  .greeting-sub { color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 4px; }
  .greeting-main { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; color: white; line-height: 1.2; margin-bottom: 20px; }
  .greeting-main em { color: var(--orange); font-style: normal; }
  .search-bar {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 14px; display: flex; align-items: center;
    padding: 12px 14px; gap: 10px; backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .search-bar svg { color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .search-bar input { flex: 1; background: none; border: none; outline: none; color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; }
  .search-bar input::placeholder { color: rgba(255,255,255,0.4); }
  .clear-search { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px; padding: 2px; }
  .promo-banner {
    margin: 16px; border-radius: var(--radius);
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
    padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 12px 30px rgba(255,107,53,0.28);
  }
  .promo-text .promo-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; background: rgba(255,255,255,0.25); border-radius: 20px; padding: 2px 8px; color: white; display: inline-block; margin-bottom: 6px; }
  .promo-text h3 { color: white; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .promo-text p { color: rgba(255,255,255,0.85); font-size: 12px; }
  .promo-art { font-size: 40px; }
  .section { padding: 0 0 8px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 10px; }
  .section-header h2 { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; }
  .section-count { font-size: 12px; color: var(--muted); }
  .categories-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .categories-scroll::-webkit-scrollbar { display: none; }
  .cat-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--card); white-space: nowrap; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: all 0.2s; flex-shrink: 0; }
  .cat-pill.active { background: var(--black); border-color: var(--black); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .popular-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 8px; scrollbar-width: none; }
  .popular-scroll::-webkit-scrollbar { display: none; }
  .popular-card { background: var(--card); border-radius: var(--radius); padding: 14px; width: 160px; flex-shrink: 0; cursor: pointer; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--border); }
  .popular-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .popular-emoji { font-size: 40px; margin-bottom: 10px; display: block; }
  .popular-name { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
  .popular-vendor { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .popular-bottom { display: flex; justify-content: space-between; align-items: center; }
  .popular-price { font-weight: 700; color: var(--orange); font-size: 14px; }
  .popular-rating { font-size: 12px; }
  .vendors-list { display: flex; flex-direction: column; gap: 12px; padding: 0 16px; }
  .vendor-card { background: var(--card); border-radius: var(--radius); overflow: hidden; cursor: pointer; border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; display: flex; min-height: 126px; }
  .vendor-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .vendor-img { width: 100px; flex-shrink: 0; background: linear-gradient(135deg, #f0ede8, #e8e4df); display: flex; align-items: center; justify-content: center; position: relative; font-size: 44px; }
  .vendor-tag { position: absolute; top: 8px; left: 8px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: white; padding: 3px 7px; border-radius: 6px; }
  .vendor-info { padding: 14px; flex: 1; min-width: 0; }
  .vendor-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .vendor-header h3 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
  .vendor-rating { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .vendor-category { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
  .vendor-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .vendor-meta span { font-size: 11px; color: var(--muted); }
  .empty-state { text-align: center; padding: 40px 16px; }
  .empty-state p { font-size: 18px; margin-bottom: 8px; font-weight: 600; }
  .empty-state span { color: var(--muted); font-size: 14px; }

  /* ── VENDOR PAGE ── */
  .vendor-hero { background: linear-gradient(145deg, rgba(255,107,53,0.16), rgba(255,255,255,0) 42%), linear-gradient(135deg, #141414, #2a190d); padding: 24px 16px; position: relative; min-height: 200px; display: flex; flex-direction: column; justify-content: flex-end; }
  .vendor-hero-art { font-size: 80px; position: absolute; top: 20px; right: 20px; opacity: 0.35; }
  .vendor-hero-overlay { position: relative; z-index: 1; }
  .vendor-hero-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: white; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 8px; }
  .vendor-hero-overlay h2 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: white; margin-bottom: 6px; }
  .vendor-hero-overlay p { color: rgba(255,255,255,0.65); font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
  .vendor-hero-meta { display: flex; gap: 14px; flex-wrap: wrap; }
  .vendor-hero-meta span { font-size: 12px; color: rgba(255,255,255,0.8); }
  .vendor-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; }
  .vtab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.2s; }
  .vtab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .menu-content { padding: 8px 0; }
  .menu-section { padding: 8px 0; }
  .menu-section-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; padding: 12px 16px 8px; }
  .menu-item { display: flex; gap: 12px; padding: 14px 16px; background: var(--card); margin: 0 16px 10px; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .menu-item-emoji { font-size: 44px; flex-shrink: 0; width: 56px; display: flex; align-items: center; justify-content: center; }
  .menu-item-info { flex: 1; min-width: 0; }
  .menu-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
  .menu-item-top h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; min-width: 0; }
  .popular-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; background: var(--orange-soft); color: var(--orange); padding: 2px 7px; border-radius: 6px; }
  .menu-item-info p { font-size: 12px; color: var(--muted); line-height: 1.4; margin-bottom: 10px; }
  .menu-item-bottom { display: flex; justify-content: space-between; align-items: center; }
  .menu-item-price { font-weight: 700; color: var(--orange); font-size: 15px; }
  .add-btn { background: var(--orange); color: white; border: none; border-radius: 10px; min-width: 70px; min-height: 34px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.2s, transform 0.18s ease; }
  .add-btn:hover { background: #e55a20; }
  .qty-control { display: flex; align-items: center; gap: 10px; background: var(--black); border-radius: 10px; padding: 6px 10px; }
  .qty-control button { background: none; border: none; color: white; font-size: 16px; cursor: pointer; width: 20px; display: flex; align-items: center; justify-content: center; }
  .qty-control span { color: white; font-weight: 700; font-size: 14px; min-width: 16px; text-align: center; }
  .reviews-content { padding: 16px; }
  .reviews-summary { display: flex; align-items: center; gap: 16px; background: var(--card); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; border: 1px solid var(--border); }
  .reviews-score { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: var(--orange); line-height: 1; }
  .reviews-stars { font-size: 18px; margin-bottom: 4px; }
  .review-card { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; border: 1px solid var(--border); }
  .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .review-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--orange); color: white; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .review-name { font-weight: 600; font-size: 14px; }
  .review-time { font-size: 11px; color: var(--muted); }
  .review-rating { margin-left: auto; font-size: 14px; }
  .review-text { font-size: 13px; color: var(--muted); line-height: 1.5; }

  /* ── CART ── */
  .cart-page { padding: 16px; }
  .cart-vendor-label { background: var(--orange-soft); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .cart-items { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
  .cart-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .cart-item-emoji { font-size: 32px; }
  .cart-item-info { flex: 1; }
  .cart-item-name { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .cart-item-price { font-size: 13px; color: var(--orange); font-weight: 600; }
  .cart-section { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .cart-section h3 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 12px; }
  .address-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; background: var(--bg); }
  .address-input:focus { border-color: var(--orange); }
  .payment-options { display: flex; flex-direction: column; gap: 8px; }
  .payment-opt { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 12px; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s; background: none; }
  .payment-opt.active { border-color: var(--orange); background: var(--orange-soft); }
  .payment-opt.disabled { opacity: 0.5; cursor: not-allowed; }
  .coming-soon { margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; background: var(--border); border-radius: 6px; padding: 2px 8px; }
  .cart-summary { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .summary-row span:first-child { color: var(--muted); }
  .total-row { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 700; }
  .btn-primary { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg, #ff6b35, #e55a20); color: white; font-size: 16px; font-weight: 700; font-family: 'Syne', sans-serif; cursor: pointer; box-shadow: 0 8px 24px rgba(255,107,53,0.4); transition: all 0.2s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,107,53,0.5); }
  .place-order-btn { margin-bottom: 16px; }
  .empty-cart { text-align: center; padding: 60px 16px; }
  .empty-cart-icon { font-size: 60px; margin-bottom: 16px; display: block; }
  .empty-cart h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-cart p { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
  .order-success { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
  .success-animation { text-align: center; padding: 24px; }
  .success-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 8px 24px rgba(16,185,129,0.4); animation: scaleIn 0.4s ease; }
  @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
  .success-animation h2 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 10px; }
  .success-animation p { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
  .success-loader { background: var(--border); border-radius: 4px; height: 4px; overflow: hidden; }
  .success-bar { height: 100%; background: var(--orange); border-radius: 4px; animation: load 2.5s linear; }
  @keyframes load { from { width: 0%; } to { width: 100%; } }

  /* ── CUSTOMER ORDERS ── */
  .orders-page { padding: 0; }
  .orders-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--card); padding: 0 16px; position: sticky; top: calc(var(--nav-h) + 36px); z-index: 10; }
  .otab { flex: 1; padding: 14px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
  .otab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .otab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .orders-list { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .order-card { background: var(--card); border-radius: var(--radius); padding: 16px; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: var(--shadow-sm); }
  .order-card.order-live { border-color: rgba(255,107,53,0.3); }
  .live-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--orange); margin-bottom: 10px; display: flex; align-items: center; gap: 4px; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .order-vendor { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 3px; }
  .order-id { font-size: 11px; color: var(--muted); }
  .order-status-badge { font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 20px; white-space: nowrap; }
  .status-track { display: flex; align-items: flex-start; background: var(--bg); border-radius: 12px; padding: 14px; margin-bottom: 14px; overflow-x: auto; gap: 0; scrollbar-width: none; }
  .status-track::-webkit-scrollbar { display: none; }
  .track-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; position: relative; min-width: 56px; }
  .track-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--border); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; transition: all 0.4s; color: var(--muted); z-index: 1; position: relative; }
  .track-step.done .track-dot { background: var(--green); border-color: var(--green); color: white; }
  .track-step.current .track-dot { background: var(--orange); border-color: var(--orange); color: white; box-shadow: 0 0 0 4px rgba(255,107,53,0.2); }
  .track-step span { font-size: 10px; color: var(--muted); text-align: center; font-weight: 500; }
  .track-step.done span, .track-step.current span { color: var(--text); font-weight: 600; }
  .track-line { position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: var(--border); z-index: 0; }
  .track-line.done { background: var(--green); }
  .order-items { border-top: 1px solid var(--border); padding-top: 12px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
  .order-item-row span:first-child { color: var(--muted); }
  .order-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; padding-top: 10px; border-top: 1px solid var(--border); margin-top: 8px; }

  /* ── PROFILE ── */
  .profile-page { padding: 0 0 16px; }
  .profile-hero { background: linear-gradient(135deg, #1a1a1a, #2d1a0a); padding: 24px 16px; display: flex; align-items: center; gap: 16px; }
  .profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), #ff8c42); color: white; font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(255,107,53,0.4); }
  .profile-info h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
  .profile-info p { color: rgba(255,255,255,0.6); font-size: 13px; }
  .profile-stats { background: var(--card); margin: 16px; border-radius: var(--radius); display: flex; align-items: center; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .profile-stat { flex: 1; padding: 16px; text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; display: block; margin-bottom: 2px; }
  .stat-label { font-size: 11px; color: var(--muted); }
  .stat-divider { width: 1px; height: 40px; background: var(--border); }
  .profile-section { margin: 0 16px 12px; }
  .profile-section-title { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); padding: 0 0 8px; }
  .profile-list { background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
  .profile-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: none; background: none; cursor: pointer; border-bottom: 1px solid var(--border); font-family: 'DM Sans', sans-serif; font-size: 14px; text-align: left; transition: background 0.15s; }
  .profile-item:last-child { border-bottom: none; }
  .profile-item:hover { background: var(--bg); }
  .profile-item-icon { font-size: 20px; }
  .profile-item-label { flex: 1; font-weight: 500; }
  .profile-item-arrow { color: var(--muted); font-size: 20px; }
  .logout-btn { margin: 16px; width: calc(100% - 32px); padding: 14px; border-radius: var(--radius); border: 1.5px solid #ef4444; background: none; color: #ef4444; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
  .logout-btn:hover { background: #fef2f2; }

  /* ── VENDOR DASHBOARD ── */
  .vd-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 32px; }
  .vd-header {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d1a0a 100%);
    padding: 20px 16px 0;
    position: sticky; top: 36px; z-index: 50;
  }
  .vd-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .vd-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; }
  .vd-logo span { color: var(--orange); }
  .vd-logo em { color: white; font-style: normal; }
  .vendor-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; padding: 6px 12px; font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .vd-tabs { display: flex; gap: 0; }
  .vd-tab { flex: 1; padding: 12px 6px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .vd-tab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .tab-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { background: var(--card); border-radius: 10px; border: 1px solid var(--border); padding: 14px; }
  .stat-card .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-card .stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .stat-card .stat-value.orange { color: var(--orange); }
  .stat-card .stat-value.green { color: var(--green); }
  .stat-card .stat-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .vd-section-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .vorder-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm); }
  .vorder-card-header { padding: 14px 16px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
  .vorder-card-id { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .vorder-card-customer { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .vorder-card-time { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .vorder-status-pill { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .vpill-pending { background: var(--yellow-soft); color: #92400e; }
  .vpill-cooking { background: var(--orange-soft); color: #9a3412; }
  .vpill-ready { background: var(--green-soft); color: #065f46; }
  .vorder-items-list { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .vorder-item-row { display: flex; justify-content: space-between; font-size: 13px; }
  .vorder-item-row .qty { color: var(--orange); font-weight: 600; margin-right: 4px; }
  .vorder-item-row .price { color: var(--muted); }
  .vorder-card-footer { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .vorder-total-label { font-size: 12px; color: var(--muted); }
  .vorder-total-amount { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; }
  .action-btns { display: flex; gap: 8px; }
  .btn-accept { background: var(--green); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .btn-accept:hover { opacity: 0.85; }
  .btn-reject { background: var(--red-soft); color: var(--red); border: 1px solid #fca5a5; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; }
  .btn-reject:hover { opacity: 0.75; }
  .btn-advance { background: var(--orange); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s; flex: 1; }
  .btn-advance:hover { opacity: 0.85; }
  .empty-orders { text-align: center; padding: 48px 0; }
  .empty-orders .emoji { font-size: 48px; margin-bottom: 12px; }
  .empty-orders p { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .empty-orders span { font-size: 13px; color: var(--muted); }

  /* VENDOR MENU MANAGEMENT */
  .vm-item-row { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); }
  .mi-emoji { font-size: 36px; flex-shrink: 0; }
  .mi-info { flex: 1; min-width: 0; }
  .mi-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
  .mi-desc { font-size: 12px; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mi-price { font-size: 14px; font-weight: 700; color: var(--orange); margin-top: 4px; }
  .mi-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .toggle { width: 40px; height: 22px; border-radius: 11px; background: #d1d0cc; border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .toggle.on { background: var(--green); }
  .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle.on::after { transform: translateX(18px); }
  .btn-edit { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--muted); font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
  .btn-edit:hover { border-color: var(--orange); color: var(--orange); }
  .btn-add-item { width: 100%; background: var(--orange-soft); color: var(--orange); border: 1.5px dashed var(--orange); border-radius: var(--radius); padding: 14px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
  .btn-add-item:hover { background: #ffe4d6; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; max-width: 420px; left: 50%; transform: translateX(-50%); }
  .modal-sheet { background: var(--card); border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; animation: slideUp 0.25s ease; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .modal-close { background: var(--bg); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: 0.4px; }
  .form-input { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--orange); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-save { width: 100%; background: var(--orange); color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 8px; transition: opacity 0.2s; }
  .btn-save:hover { opacity: 0.9; }

  /* TOAST */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--black); color: white; padding: 10px 18px; border-radius: 100px; font-size: 13px; font-weight: 500; z-index: 999; white-space: nowrap; animation: toastIn 0.25s ease; max-width: 360px; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  @media (min-width: 520px) {
    body { padding: 18px 0; }
    .kivo-root {
      min-height: calc(100svh - 36px);
      height: calc(100svh - 36px);
      border-radius: 28px;
    }
    .role-switcher, .navbar, .bottom-nav, .modal-overlay { max-width: 420px; }
    .role-switcher { top: 18px; border-radius: 28px 28px 0 0; overflow: hidden; }
    .navbar { top: 54px; }
    .bottom-nav { bottom: 18px; border-radius: 0 0 28px 28px; overflow: hidden; }
    .main-content { height: calc(100svh - 36px); min-height: calc(100svh - 36px); }
    .toast { bottom: 42px; }
  }

  @media (max-width: 360px) {
    .role-switcher { padding: 0 12px; gap: 6px; }
    .role-btn { padding-inline: 9px; }
    .greeting-main { font-size: 25px; }
    .vendor-card { min-height: 118px; }
    .vendor-img { width: 88px; font-size: 38px; }
    .menu-item { padding: 12px; margin-inline: 12px; }
    .menu-item-emoji { width: 46px; font-size: 36px; }
    .vendor-meta { gap: 7px; }
  }
`;

// ─── VENDOR DASHBOARD DATA ────────────────────────────────────────────────────
const INITIAL_VORDERS = [
  { id: "KV-5041", customer: "Grace M.", time: "Just now", status: "Pending", items: [{ name: "Ugali & Beef Stew", qty: 2, price: 4.50 }, { name: "Pilau Rice", qty: 1, price: 5.00 }], total: 14.00 },
  { id: "KV-5039", customer: "James O.", time: "4 min ago", status: "Pending", items: [{ name: "Nyama Choma Plate", qty: 1, price: 7.00 }, { name: "Sukuma Wiki + Chapati", qty: 2, price: 2.50 }], total: 12.00 },
  { id: "KV-5037", customer: "Amina H.", time: "9 min ago", status: "Cooking", items: [{ name: "Githeri Special", qty: 1, price: 3.00 }, { name: "Pilau Rice", qty: 2, price: 5.00 }], total: 13.00 },
  { id: "KV-5035", customer: "David K.", time: "15 min ago", status: "Ready", items: [{ name: "Nyama Choma Plate", qty: 2, price: 7.00 }], total: 14.00 },
];

const INITIAL_VMENU = [
  { id: 101, name: "Ugali & Beef Stew", price: 4.50, image: "🍖", description: "Creamy ugali with slow-cooked beef stew", available: true },
  { id: 102, name: "Nyama Choma Plate", price: 7.00, image: "🥩", description: "Grilled goat with kachumbari and ugali", available: true },
  { id: 103, name: "Githeri Special", price: 3.00, image: "🫘", description: "Maize & beans with tomatoes and onions", available: false },
  { id: 104, name: "Sukuma Wiki + Chapati", price: 2.50, image: "🫓", description: "Sautéed collard greens with 3 fresh chapatis", available: true },
  { id: 105, name: "Pilau Rice", price: 5.00, image: "🍚", description: "Fragrant spiced rice with beef", available: true },
];

// ─── ACCOUNT COMPONENTS ──────────────────────────────────────────────────────
function AuthScreen() {
  const { login, register } = useAccount();
  const [mode, setMode] = useState("register");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ ...form, role });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-logo"><span>K</span>ivo</div>
        <p>One account for food delivery, restaurant orders, and vendor operations.</p>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Create account</button>
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign in</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="role-choice">
                <button type="button" className={role === "customer" ? "active" : ""} onClick={() => setRole("customer")}>👤 Customer</button>
                <button type="button" className={role === "vendor" ? "active" : ""} onClick={() => setRole("vendor")}>🏪 Vendor</button>
              </div>
              <input className="auth-input" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Full name" autoComplete="name" />
              <input className="auth-input" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Phone number" autoComplete="tel" />
              {role === "vendor" && (
                <input className="auth-input" value={form.businessName} onChange={e => update("businessName", e.target.value)} placeholder="Restaurant or shop name" />
              )}
            </>
          )}

          <input className="auth-input" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="Email address" autoComplete="email" />
          <input className="auth-input" type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Sign in" : `Create ${role} account`}
          </button>
        </form>

        <p className="auth-hint">Use a real email and phone format now. Later we can add OTP verification, permissions, and payment identity checks.</p>
      </div>
    </div>
  );
}

// ─── CUSTOMER COMPONENTS ──────────────────────────────────────────────────────
function Navbar({ screen, navigate }) {
  const { count } = useCart();
  const titles = { home: null, vendor: "Restaurant", cart: "My Cart", orders: "My Orders", profile: "Profile" };
  return (
    <nav className="navbar">
      {screen !== "home" ? (
        <div className="nav-inner nav-page">
          <button className="nav-back" onClick={() => navigate("home")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <span className="nav-title">{titles[screen]}</span>
          <div style={{ width: 36 }} />
        </div>
      ) : (
        <div className="nav-inner nav-home">
          <div className="nav-logo"><span className="logo-k">K</span><span className="logo-ivo">ivo</span></div>
          <div className="nav-actions">
            <button className="nav-icon-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg><span className="notif-dot" /></button>
            <button className="nav-icon-btn" onClick={() => navigate("cart")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function BottomNav({ screen, navigate }) {
  const tabs = [
    { id: "home", label: "Home", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "orders", label: "Orders", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg> },
    { id: "cart", label: "Cart", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
    { id: "profile", label: "Profile", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button key={tab.id} className={`bottom-tab ${screen === tab.id ? "active" : ""}`} onClick={() => navigate(tab.id)}>
          {tab.icon}<span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Home({ navigate }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(1);
  const filtered = vendors.filter(v => {
    const ms = v.name.toLowerCase().includes(search.toLowerCase());
    const mc = activeCategory === 1 || v.category === categories.find(c => c.id === activeCategory)?.name;
    return ms && mc;
  });
  return (
    <div className="page home-page">
      <div className="home-hero">
        <p className="greeting-sub">Good afternoon 👋</p>
        <h1 className="greeting-main">What are you <br /><em>craving today?</em></h1>
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search food or restaurants..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="clear-search" onClick={() => setSearch("")}>✕</button>}
        </div>
      </div>
      {!search && (
        <div className="promo-banner">
          <div className="promo-text"><span className="promo-tag">🔥 LIMITED TIME</span><h3>Free delivery on first order!</h3><p>Use code <strong>KIVO1ST</strong></p></div>
          <div className="promo-art">🛵</div>
        </div>
      )}
      <section className="section">
        <div className="categories-scroll">
          {categories.map(cat => (
            <button key={cat.id} className={`cat-pill ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
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
              <div key={meal.id} className="popular-card" onClick={() => navigate("vendor", vendors.find(v => v.id === meal.vendorId))}>
                <span className="popular-emoji">{meal.image}</span>
                <p className="popular-name">{meal.name}</p>
                <p className="popular-vendor">{meal.vendorName}</p>
                <div className="popular-bottom"><span className="popular-price">${meal.price.toFixed(2)}</span><span className="popular-rating">⭐ {meal.rating}</span></div>
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
                  <div className="vendor-header"><h3>{v.name}</h3><span className="vendor-rating">⭐ {v.rating}</span></div>
                  <p className="vendor-category">{v.category}</p>
                  <div className="vendor-meta"><span>📍 {v.distance}</span><span>⏱ {v.deliveryTime}</span><span>🛵 ${v.deliveryFee.toFixed(2)}</span></div>
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

function MenuItem({ item, vendor, addItem, getQty, removeItem }) {
  const qty = getQty(item.id);
  return (
    <div className="menu-item">
      <div className="menu-item-emoji">{item.image}</div>
      <div className="menu-item-info">
        <div className="menu-item-top"><h4>{item.name}</h4>{item.popular && <span className="popular-badge">Popular</span>}</div>
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

function VendorPage({ vendor }) {
  const { addItem, getQty, removeItem } = useCart();
  const [tab, setTab] = useState("menu");
  if (!vendor) return null;
  const reviews = [
    { name: "John M.", rating: 5, text: "Absolutely amazing food! The nyama choma was perfectly cooked.", time: "2 days ago" },
    { name: "Amina K.", rating: 5, text: "Quick delivery and the food was still hot. Will order again!", time: "5 days ago" },
    { name: "David O.", rating: 4, text: "Great flavors, portions could be bigger but overall great.", time: "1 week ago" },
  ];
  return (
    <div className="page vendor-page">
      <div className="vendor-hero">
        <div className="vendor-hero-art">{vendor.image}</div>
        <div className="vendor-hero-overlay">
          <span className="vendor-hero-tag" style={{ background: vendor.tagColor }}>{vendor.tag}</span>
          <h2>{vendor.name}</h2>
          <p>{vendor.description}</p>
          <div className="vendor-hero-meta"><span>⭐ {vendor.rating} ({vendor.reviews})</span><span>⏱ {vendor.deliveryTime}</span><span>🛵 ${vendor.deliveryFee.toFixed(2)} delivery</span></div>
        </div>
      </div>
      <div className="vendor-tabs">
        {["menu", "reviews"].map(t => (
          <button key={t} className={`vtab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === "menu" && (
        <div className="menu-content">
          {vendor.menu.filter(i => i.popular).length > 0 && (
            <div className="menu-section">
              <h3 className="menu-section-title">⭐ Popular Items</h3>
              {vendor.menu.filter(i => i.popular).map(item => <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />)}
            </div>
          )}
          <div className="menu-section">
            <h3 className="menu-section-title">📋 Full Menu</h3>
            {vendor.menu.map(item => <MenuItem key={item.id} item={item} vendor={vendor} addItem={addItem} getQty={getQty} removeItem={removeItem} />)}
          </div>
        </div>
      )}
      {tab === "reviews" && (
        <div className="reviews-content">
          <div className="reviews-summary"><div className="reviews-score">{vendor.rating}</div><div><div className="reviews-stars">{"⭐".repeat(Math.round(vendor.rating))}</div><p>{vendor.reviews} reviews</p></div></div>
          {reviews.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-header"><div className="review-avatar">{r.name[0]}</div><div><p className="review-name">{r.name}</p><p className="review-time">{r.time}</p></div><span className="review-rating">{"⭐".repeat(r.rating)}</span></div>
              <p className="review-text">{r.text}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 90 }} />
    </div>
  );
}

function Cart({ navigate }) {
  const { items, addItem, removeItem, clearCart, total, vendorName } = useCart();
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [placed, setPlaced] = useState(false);
  const deliveryFee = items.length > 0 ? 2.00 : 0;
  const grandTotal = total + deliveryFee;
  const placeOrder = () => {
    if (!address.trim()) { alert("Please enter a delivery address."); return; }
    setPlaced(true);
    setTimeout(() => { clearCart(); navigate("orders"); }, 2600);
  };
  if (placed) return (
    <div className="page cart-page order-success">
      <div className="success-animation">
        <div className="success-circle">✓</div>
        <h2>Order Placed!</h2>
        <p>Your order has been sent to {vendorName}.<br />You'll be notified when accepted.</p>
        <div className="success-loader"><div className="success-bar" /></div>
      </div>
    </div>
  );
  if (items.length === 0) return (
    <div className="page cart-page">
      <div className="empty-cart">
        <span className="empty-cart-icon">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Add some delicious food to get started</p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{ width: "auto", padding: "14px 32px" }}>Browse Restaurants</button>
      </div>
    </div>
  );
  return (
    <div className="page cart-page">
      <div className="cart-vendor-label"><span>🏪</span> Ordering from <strong>&nbsp;{vendorName}</strong></div>
      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-emoji">{item.image}</div>
            <div className="cart-item-info"><p className="cart-item-name">{item.name}</p><p className="cart-item-price">${(item.price * item.qty).toFixed(2)}</p></div>
            <div className="qty-control">
              <button onClick={() => removeItem(item.id)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => addItem(item, { id: item.vendorId || null, name: vendorName })}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-section">
        <h3>📍 Delivery Address</h3>
        <input className="address-input" placeholder="Enter your delivery address..." value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div className="cart-section">
        <h3>💳 Payment Method</h3>
        <div className="payment-options">
          {[{ id: "cash", label: "Cash on Delivery", icon: "💵" }, { id: "mobile", label: "Mobile Money", icon: "📱", disabled: true }, { id: "card", label: "Card Payment", icon: "💳", disabled: true }].map(opt => (
            <button key={opt.id} className={`payment-opt ${payMethod === opt.id ? "active" : ""} ${opt.disabled ? "disabled" : ""}`} onClick={() => !opt.disabled && setPayMethod(opt.id)}>
              <span>{opt.icon}</span><span>{opt.label}</span>
              {opt.disabled && <span className="coming-soon">Coming Soon</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
        <div className="summary-row"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
        <div className="summary-row total-row"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
      </div>
      <button className="btn-primary place-order-btn" onClick={placeOrder}>Place Order · ${grandTotal.toFixed(2)}</button>
      <div style={{ height: 20 }} />
    </div>
  );
}

const STATUSES = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];
const STATUS_ICONS = { Pending: "🕐", Accepted: "✅", Cooking: "👨‍🍳", Ready: "📦", Delivered: "🛵" };
const STATUS_COLORS = { Pending: "#f59e0b", Accepted: "#6366f1", Cooking: "#ff6b35", Ready: "#10b981", Delivered: "#10b981" };
const SAMPLE_ORDERS = [
  { id: "KV-2024-001", vendor: "Mama Njeri's Kitchen", items: [{ name: "Ugali & Beef Stew", qty: 2, price: 4.50 }, { name: "Pilau Rice", qty: 1, price: 5.00 }], total: 16.00, status: "Cooking", time: "12 mins ago", live: true },
  { id: "KV-2024-002", vendor: "Burger Stack", items: [{ name: "Classic Smash Burger", qty: 1, price: 6.00 }, { name: "Loaded Fries", qty: 1, price: 3.50 }], total: 11.50, status: "Delivered", time: "Yesterday", live: false },
  { id: "KV-2024-003", vendor: "Chill & Sip", items: [{ name: "Tropical Blast", qty: 2, price: 3.50 }], total: 8.00, status: "Delivered", time: "3 days ago", live: false },
];

function OrderCard({ order }) {
  const statusIdx = STATUSES.indexOf(order.status);
  return (
    <div className={`order-card ${order.live ? "order-live" : ""}`}>
      {order.live && <div className="live-badge">🔴 LIVE UPDATE</div>}
      <div className="order-header">
        <div><p className="order-vendor">{order.vendor}</p><p className="order-id">{order.id} · {order.time}</p></div>
        <span className="order-status-badge" style={{ background: STATUS_COLORS[order.status] + "22", color: STATUS_COLORS[order.status] }}>{STATUS_ICONS[order.status]} {order.status}</span>
      </div>
      {order.live && (
        <div className="status-track">
          {STATUSES.slice(0, -1).map((s, i) => (
            <div key={s} className={`track-step ${i <= statusIdx ? "done" : ""} ${i === statusIdx ? "current" : ""}`}>
              <div className="track-dot">{i < statusIdx ? "✓" : i === statusIdx ? STATUS_ICONS[s] : ""}</div>
              <span>{s}</span>
              {i < STATUSES.length - 2 && <div className={`track-line ${i < statusIdx ? "done" : ""}`} />}
            </div>
          ))}
        </div>
      )}
      <div className="order-items">
        {order.items.map((item, i) => <div key={i} className="order-item-row"><span>{item.qty}× {item.name}</span><span>${(item.price * item.qty).toFixed(2)}</span></div>)}
      </div>
      <div className="order-total"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [tab, setTab] = useState("active");
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (!o.live) return o;
        const idx = STATUSES.indexOf(o.status);
        if (idx < STATUSES.length - 1) return { ...o, status: STATUSES[idx + 1], live: STATUSES[idx + 1] !== "Delivered" };
        return o;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const active = orders.filter(o => o.status !== "Delivered");
  const history = orders.filter(o => o.status === "Delivered");
  return (
    <div className="page orders-page">
      <div className="orders-tabs">
        <button className={`otab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Active {active.length > 0 && <span className="otab-badge">{active.length}</span>}</button>
        <button className={`otab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>History</button>
      </div>
      <div className="orders-list">
        {tab === "active" && (active.length === 0 ? <div className="empty-state"><p>📭 No active orders</p><span>Active orders will appear here</span></div> : active.map(o => <OrderCard key={o.id} order={o} />))}
        {tab === "history" && history.map(o => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

function Profile() {
  const { user, logout } = useAccount();
  const stats = { orders: 14, saved: 3 };
  const sections = [
    { title: "Account", items: [{ icon: "👤", label: "Edit Profile" }, { icon: "📍", label: "Saved Addresses" }, { icon: "💳", label: "Payment Methods" }] },
    { title: "Activity", items: [{ icon: "📦", label: "Order History" }, { icon: "❤️", label: "Favourite Restaurants" }, { icon: "⭐", label: "My Reviews" }] },
    { title: "Support", items: [{ icon: "💬", label: "Help & Support" }, { icon: "📄", label: "Terms & Privacy" }, { icon: "🔔", label: "Notifications" }] },
  ];
  return (
    <div className="page profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{user.name[0]}</div>
        <div className="profile-info"><h2>{user.name}</h2><p>{user.phone}</p><p>{user.email}</p></div>
      </div>
      <div className="profile-stats">
        <div className="profile-stat"><span className="stat-num">{stats.orders}</span><span className="stat-label">Orders</span></div>
        <div className="stat-divider" />
        <div className="profile-stat"><span className="stat-num">{stats.saved}</span><span className="stat-label">Saved</span></div>
        <div className="stat-divider" />
        <div className="profile-stat"><span className="stat-num">{user.role === "vendor" ? "🏪" : "👤"}</span><span className="stat-label">{user.role}</span></div>
      </div>
      {sections.map(s => (
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

// ─── VENDOR DASHBOARD COMPONENTS ─────────────────────────────────────────────
const VSTATUS_NEXT = { Cooking: "Ready", Ready: "Collected" };
const VSTATUS_NEXT_LABEL = { Cooking: "Mark Ready", Ready: "Mark Collected" };

function VStatusPill({ status }) {
  const cls = status === "Pending" ? "vpill-pending" : status === "Cooking" ? "vpill-cooking" : "vpill-ready";
  const icons = { Pending: "🕐", Cooking: "👨‍🍳", Ready: "📦" };
  return <span className={`vorder-status-pill ${cls}`}>{icons[status]} {status}</span>;
}

function VOrdersTab({ vorders, setVorders, showToast }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Pending", "Cooking", "Ready"];
  const accept = (id) => { setVorders(prev => prev.map(o => o.id === id ? { ...o, status: "Cooking" } : o)); showToast("✅ Order accepted — start cooking!"); };
  const reject = (id) => { setVorders(prev => prev.filter(o => o.id !== id)); showToast("❌ Order rejected & removed"); };
  const advance = (id) => {
    setVorders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = VSTATUS_NEXT[o.status];
      if (!next) return o;
      if (next === "Collected") { showToast("🛵 Order collected — done!"); return null; }
      showToast(next === "Ready" ? "📦 Order marked ready for pickup!" : "✅ Done!");
      return { ...o, status: next };
    }).filter(Boolean));
  };
  const visible = filter === "All" ? vorders : vorders.filter(o => o.status === filter);
  const pendingCount = vorders.filter(o => o.status === "Pending").length;
  return (
    <div className="vd-content">
      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value orange">{vorders.filter(o => o.status === "Pending").length}</div><div className="stat-sub">awaiting action</div></div>
        <div className="stat-card"><div className="stat-label">Today's orders</div><div className="stat-value green">{vorders.length + 3}</div><div className="stat-sub">+3 completed</div></div>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid", borderColor: filter === f ? "#0f0f0f" : "#e8e4df", background: filter === f ? "#0f0f0f" : "#fff", color: filter === f ? "#fff" : "#7a7065", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "DM Sans, sans-serif" }}>
            {f}{f === "Pending" && pendingCount > 0 && <span style={{ marginLeft: 5, background: "#ff6b35", color: "white", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty-orders"><div className="emoji">🎉</div><p>All caught up!</p><span>No {filter !== "All" ? filter.toLowerCase() : ""} orders right now</span></div>
      ) : visible.map(order => (
        <div key={order.id} className="vorder-card">
          <div className="vorder-card-header">
            <div><div className="vorder-card-id">{order.id}</div><div className="vorder-card-customer">{order.customer}</div><div className="vorder-card-time">{order.time}</div></div>
            <VStatusPill status={order.status} />
          </div>
          <div className="vorder-items-list">
            {order.items.map((item, i) => <div key={i} className="vorder-item-row"><span><span className="qty">{item.qty}×</span>{item.name}</span><span className="price">${(item.price * item.qty).toFixed(2)}</span></div>)}
          </div>
          <div className="vorder-card-footer">
            <div><div className="vorder-total-label">Order total</div><div className="vorder-total-amount">${order.total.toFixed(2)}</div></div>
            <div className="action-btns">
              {order.status === "Pending" ? (<><button className="btn-reject" onClick={() => reject(order.id)}>Reject</button><button className="btn-accept" onClick={() => accept(order.id)}>Accept</button></>) : (<button className="btn-advance" onClick={() => advance(order.id)}>{VSTATUS_NEXT_LABEL[order.status]}</button>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VMenuTab({ vmenu, setVmenu, showToast }) {
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({});
  const toggleAvail = (id) => {
    const item = vmenu.find(m => m.id === id);
    setVmenu(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));
    showToast(item.available ? `⏸ "${item.name}" hidden from menu` : `✅ "${item.name}" back on menu`);
  };
  const openEdit = (item) => { setForm({ ...item, price: item.price.toString() }); setEditingItem(item.id); setIsAdding(false); };
  const openAdd = () => { setForm({ name: "", price: "", image: "🍽️", description: "", available: true }); setIsAdding(true); setEditingItem(null); };
  const saveEdit = () => {
    if (!form.name || !form.price) return;
    if (isAdding) { setVmenu(prev => [...prev, { ...form, id: Math.max(...prev.map(m => m.id)) + 1, price: parseFloat(form.price) }]); showToast("✨ New item added to menu!"); }
    else { setVmenu(prev => prev.map(m => m.id === editingItem ? { ...form, id: m.id, price: parseFloat(form.price) } : m)); showToast("✏️ Menu item updated!"); }
    setEditingItem(null); setIsAdding(false);
  };
  const deleteItem = () => { setVmenu(prev => prev.filter(m => m.id !== editingItem)); showToast("🗑 Item removed from menu"); setEditingItem(null); };
  const available = vmenu.filter(m => m.available);
  const hidden = vmenu.filter(m => !m.available);
  const showModal = editingItem !== null || isAdding;
  return (
    <div className="vd-content">
      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Live items</div><div className="stat-value green">{available.length}</div><div className="stat-sub">visible to customers</div></div>
        <div className="stat-card"><div className="stat-label">Hidden</div><div className="stat-value" style={{ color: "#7a7065" }}>{hidden.length}</div><div className="stat-sub">not on menu</div></div>
      </div>
      {available.length > 0 && <><div className="vd-section-title">Live on Menu</div>{available.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}</>}
      {hidden.length > 0 && <><div className="vd-section-title" style={{ color: "#7a7065" }}>Hidden</div>{hidden.map(item => <VMenuItemRow key={item.id} item={item} onToggle={toggleAvail} onEdit={openEdit} />)}</>}
      <button className="btn-add-item" onClick={openAdd}><span style={{ fontSize: 18 }}>+</span> Add Menu Item</button>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setEditingItem(null), setIsAdding(false))}>
          <div className="modal-sheet">
            <div className="modal-title">{isAdding ? "Add New Item" : "Edit Item"}<button className="modal-close" onClick={() => { setEditingItem(null); setIsAdding(false); }}>✕</button></div>
            <div className="form-group"><label className="form-label">Emoji Icon</label><input className="form-input" value={form.image || ""} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="🍽️" style={{ fontSize: 22, textAlign: "center" }} /></div>
            <div className="form-group"><label className="form-label">Item Name</label><input className="form-input" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nyama Choma Plate" /></div>
            <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" /></div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Price ($)</label><input className="form-input" type="number" step="0.50" value={form.price || ""} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Available?</label><div style={{ paddingTop: 8 }}><button className={`toggle ${form.available ? "on" : ""}`} onClick={() => setForm({ ...form, available: !form.available })} /></div></div>
            </div>
            <button className="btn-save" onClick={saveEdit}>{isAdding ? "Add to Menu" : "Save Changes"}</button>
            {!isAdding && <button onClick={deleteItem} style={{ width: "100%", background: "none", border: "none", color: "#ef4444", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 12, fontFamily: "DM Sans, sans-serif", padding: "8px" }}>Remove this item</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function VMenuItemRow({ item, onToggle, onEdit }) {
  return (
    <div className="vm-item-row" style={{ opacity: item.available ? 1 : 0.55 }}>
      <div className="mi-emoji">{item.image}</div>
      <div className="mi-info"><div className="mi-name">{item.name}</div><div className="mi-desc">{item.description}</div><div className="mi-price">${item.price.toFixed(2)}</div></div>
      <div className="mi-right"><button className={`toggle ${item.available ? "on" : ""}`} onClick={() => onToggle(item.id)} /><button className="btn-edit" onClick={() => onEdit(item)}>Edit</button></div>
    </div>
  );
}

function VendorDashboard({ showToast }) {
  const { user, logout } = useAccount();
  const [vtab, setVtab] = useState("orders");
  const [vorders, setVorders] = useState(INITIAL_VORDERS);
  const [vmenu, setVmenu] = useState(INITIAL_VMENU);
  const pendingCount = vorders.filter(o => o.status === "Pending").length;
  const businessName = user?.businessName || "Vendor account";
  return (
    <>
      <div className="vd-header">
        <div className="vd-header-top">
          <div className="vd-logo"><span>K</span><em>ivo</em> <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "DM Sans, sans-serif", fontWeight: 400 }}>Vendor</span></div>
          <button className="vendor-badge" onClick={logout}><div className="online-dot" />{businessName}</button>
        </div>
        <div className="vd-tabs">
          <button className={`vd-tab ${vtab === "orders" ? "active" : ""}`} onClick={() => setVtab("orders")}>Orders {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}</button>
          <button className={`vd-tab ${vtab === "menu" ? "active" : ""}`} onClick={() => setVtab("menu")}>Menu</button>
        </div>
      </div>
      {vtab === "orders" && <VOrdersTab vorders={vorders} setVorders={setVorders} showToast={showToast} />}
      {vtab === "menu" && <VMenuTab vmenu={vmenu} setVmenu={setVmenu} showToast={showToast} />}
    </>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function KivoShell() {
  const { user, initializing } = useAccount();
  const role = user?.role || "customer";
  const [screen, setScreen] = useState("home");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const navigate = (to, data = null) => {
    if (data) setSelectedVendor(data);
    setScreen(to);
    document.querySelector(".main-content")?.scrollTo(0, 0);
  };

  if (initializing) {
    return (
      <>
        <style>{CSS}</style>
        <div className="kivo-root"><div className="boot-screen">Loading Kivo...</div></div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{CSS}</style>
        <div className="kivo-root"><AuthScreen /></div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="kivo-root">
        {/* Account role bar */}
        <div className="role-switcher">
          <span className="role-label">Signed in</span>
          <button className="role-btn active">{role === "vendor" ? "🏪 Vendor" : "👤 Customer"}</button>
        </div>

        {role === "customer" ? (
          <>
            <Navbar screen={screen} navigate={navigate} />
            <div className="main-content">
              {screen === "home" && <Home navigate={navigate} />}
              {screen === "vendor" && <VendorPage vendor={selectedVendor} navigate={navigate} />}
              {screen === "cart" && <Cart navigate={navigate} />}
              {screen === "orders" && <Orders />}
              {screen === "profile" && <Profile />}
            </div>
            <BottomNav screen={screen} navigate={navigate} />
          </>
        ) : (
          <div style={{ paddingTop: 36, minHeight: "100vh" }}>
            <VendorDashboard showToast={showToast} />
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

export default function KivoApp() {
  return (
    <AccountProvider>
      <CartProvider>
        <KivoShell />
      </CartProvider>
    </AccountProvider>
  );
}

