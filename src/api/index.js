const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── CORE FETCH ───────────────────────────────────────────────────────────────
export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("kivo_token");
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

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  me:       ()     => apiRequest("/api/auth/me"),
  login:    (body) => apiRequest("/api/auth/login",    { method: "POST", body }),
  register: (body) => apiRequest("/api/auth/register", { method: "POST", body }),
};

// ─── VENDORS ─────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list:          (category)  => apiRequest(`/api/vendors${category && category !== "All" ? `?category=${category}` : ""}`),
  get:           (id)        => apiRequest(`/api/vendors/${id}`),
  myProfile:     ()          => apiRequest("/api/vendors/me/profile"),
  updateProfile: (body)      => apiRequest("/api/vendors/me/profile", { method: "PATCH", body }),
  myMenu:        ()          => apiRequest("/api/vendors/me/menu"),
  addItem:       (body)      => apiRequest("/api/vendors/me/menu",           { method: "POST",   body }),
  updateItem:    (id, body)  => apiRequest(`/api/vendors/me/menu/${id}`,     { method: "PATCH",  body }),
  deleteItem:    (id)        => apiRequest(`/api/vendors/me/menu/${id}`,     { method: "DELETE" }),
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  place:         (body) => apiRequest("/api/orders",         { method: "POST", body }),
  myOrders:      ()     => apiRequest("/api/orders"),
  get:           (id)   => apiRequest(`/api/orders/${id}`),
  // vendor
  vendorActive:  ()     => apiRequest("/api/orders/vendor/active"),
  vendorHistory: ()     => apiRequest("/api/orders/vendor/history"),
  setStatus:     (id, status) => apiRequest(`/api/orders/${id}/status`, { method: "PATCH", body: { status } }),
  cancel:        (id)   => apiRequest(`/api/orders/${id}`,   { method: "DELETE" }),
};

// ─── SSE ─────────────────────────────────────────────────────────────────────
export function subscribeOrderSSE(orderId, onUpdate) {
  const token = localStorage.getItem("kivo_token");
  const url = `${API_BASE}/api/sse/order/${orderId}?token=${token}`;
  const es = new EventSource(url);
  es.addEventListener("order_update", e => onUpdate(JSON.parse(e.data)));
  es.onerror = () => es.close();
  return () => es.close();   // return unsubscribe fn
}

export function subscribeVendorSSE(onNewOrder, onUpdate) {
  const token = localStorage.getItem("kivo_token");
  const url = `${API_BASE}/api/sse/vendor?token=${token}`;
  const es = new EventSource(url);
  es.addEventListener("new_order",    e => onNewOrder(JSON.parse(e.data)));
  es.addEventListener("order_update", e => onUpdate(JSON.parse(e.data)));
  es.onerror = () => es.close();
  return () => es.close();
}