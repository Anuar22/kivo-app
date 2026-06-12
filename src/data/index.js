// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export const categories = [
  { id: 1, name: "All", emoji: "🍽️" },
  { id: 2, name: "Burgers", emoji: "🍔" },
  { id: 3, name: "Pizza", emoji: "🍕" },
  { id: 4, name: "Local Food", emoji: "🍛" },
  { id: 5, name: "Drinks", emoji: "🥤" },
  { id: 6, name: "Grills", emoji: "🍖" },
];

// ─── VENDORS ─────────────────────────────────────────────────────────────────
export const vendors = [
  {
    id: 1, name: "Mama Njeri's Kitchen", category: "Local Food",
    rating: 4.8, reviews: 312, distance: "0.8 km", deliveryTime: "20–30 min", deliveryFee: 1.5,
    image: "🍛", tag: "Top Rated", tagColor: "#e53935",
    description: "Authentic East African home cooking. Ugali, nyama choma, sukuma wiki and more.",
    menu: [
      { id: 101, name: "Ugali & Beef Stew", price: 4.50, image: "🍖", description: "Creamy ugali with slow-cooked beef stew", popular: true },
      { id: 102, name: "Nyama Choma Plate", price: 7.00, image: "🥩", description: "Grilled goat with kachumbari and ugali", popular: true },
      { id: 103, name: "Githeri Special", price: 3.00, image: "🫘", description: "Maize & beans with tomatoes and onions", popular: false },
      { id: 104, name: "Sukuma Wiki + Chapati", price: 2.50, image: "🫓", description: "Sautéed collard greens with 3 fresh chapatis", popular: false },
      { id: 105, name: "Pilau Rice", price: 5.00, image: "🍚", description: "Fragrant spiced rice with beef", popular: true },
    ],
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
    ],
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
    ],
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
    ],
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
    ],
  },
];

// ─── POPULAR MEALS ────────────────────────────────────────────────────────────
export const popularMeals = [
  { id: "p1", name: "Nyama Choma Plate", vendorId: 1, vendorName: "Mama Njeri's", price: 7.00, image: "🥩", rating: 4.9 },
  { id: "p2", name: "Classic Smash Burger", vendorId: 2, vendorName: "Burger Stack", price: 6.00, image: "🍔", rating: 4.8 },
  { id: "p3", name: "Tropical Blast", vendorId: 4, vendorName: "Chill & Sip", price: 3.50, image: "🥭", rating: 4.7 },
  { id: "p4", name: "Mixed Grill Platter", vendorId: 5, vendorName: "The Grill House", price: 18.00, image: "🥩", rating: 4.9 },
];

// ─── ORDER STATUS ─────────────────────────────────────────────────────────────
export const STATUSES = ["Pending", "Accepted", "Cooking", "Ready", "Delivered"];
export const STATUS_ICONS = { Pending: "🕐", Accepted: "✅", Cooking: "👨‍🍳", Ready: "📦", Delivered: "🛵" };
export const STATUS_COLORS = {
  Pending: "#f59e0b", Accepted: "#6366f1", Cooking: "#e53935",
  Ready: "#10b981", Delivered: "#10b981",
};

export const SAMPLE_ORDERS = [
  {
    id: "KV-2024-001", vendor: "Mama Njeri's Kitchen",
    items: [{ name: "Ugali & Beef Stew", qty: 2, price: 4.50 }, { name: "Pilau Rice", qty: 1, price: 5.00 }],
    total: 16.00, status: "Cooking", time: "12 mins ago", live: true,
  },
  {
    id: "KV-2024-002", vendor: "Burger Stack",
    items: [{ name: "Classic Smash Burger", qty: 1, price: 6.00 }, { name: "Loaded Fries", qty: 1, price: 3.50 }],
    total: 11.50, status: "Delivered", time: "Yesterday", live: false,
  },
  {
    id: "KV-2024-003", vendor: "Chill & Sip",
    items: [{ name: "Tropical Blast", qty: 2, price: 3.50 }],
    total: 8.00, status: "Delivered", time: "3 days ago", live: false,
  },
];

// ─── VENDOR DASHBOARD DATA ────────────────────────────────────────────────────
export const INITIAL_VORDERS = [
  { id: "KV-5041", customer: "Grace M.", time: "Just now", status: "Pending", items: [{ name: "Ugali & Beef Stew", qty: 2, price: 4.50 }, { name: "Pilau Rice", qty: 1, price: 5.00 }], total: 14.00 },
  { id: "KV-5039", customer: "James O.", time: "4 min ago", status: "Pending", items: [{ name: "Nyama Choma Plate", qty: 1, price: 7.00 }, { name: "Sukuma Wiki + Chapati", qty: 2, price: 2.50 }], total: 12.00 },
  { id: "KV-5037", customer: "Amina H.", time: "9 min ago", status: "Cooking", items: [{ name: "Githeri Special", qty: 1, price: 3.00 }, { name: "Pilau Rice", qty: 2, price: 5.00 }], total: 13.00 },
  { id: "KV-5035", customer: "David K.", time: "15 min ago", status: "Ready", items: [{ name: "Nyama Choma Plate", qty: 2, price: 7.00 }], total: 14.00 },
];

export const INITIAL_VMENU = [
  { id: 101, name: "Ugali & Beef Stew", price: 4.50, image: "🍖", description: "Creamy ugali with slow-cooked beef stew", available: true },
  { id: 102, name: "Nyama Choma Plate", price: 7.00, image: "🥩", description: "Grilled goat with kachumbari and ugali", available: true },
  { id: 103, name: "Githeri Special", price: 3.00, image: "🫘", description: "Maize & beans with tomatoes and onions", available: false },
  { id: 104, name: "Sukuma Wiki + Chapati", price: 2.50, image: "🫓", description: "Sautéed collard greens with 3 fresh chapatis", available: true },
  { id: 105, name: "Pilau Rice", price: 5.00, image: "🍚", description: "Fragrant spiced rice with beef", available: true },
];

export const VSTATUS_NEXT = { Cooking: "Ready", Ready: "Collected" };
export const VSTATUS_NEXT_LABEL = { Cooking: "Mark Ready", Ready: "Mark Collected" };

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";