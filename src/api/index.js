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
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong.");
    err.data = data; // preserves extra fields like pendingVerification/email for callers that need them
    throw err;
  }
  return data;
}

// Uploads a File/Blob as multipart/form-data — used for menu photos and vendor
// cover images. Separate from apiRequest because it must NOT set
// Content-Type: application/json or stringify the body.
export async function apiUpload(path, file, fieldName = "photo") {
  const token = localStorage.getItem("kivo_token");
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Upload failed.");
    err.data = data;
    throw err;
  }
  return data;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  me:             ()     => apiRequest("/api/auth/me"),
  login:          (body) => apiRequest("/api/auth/login",          { method: "POST", body }),
  register:       (body) => apiRequest("/api/auth/register",       { method: "POST", body }),
  verifyEmail:    (body) => apiRequest("/api/auth/verify-email",   { method: "POST", body }),
  resendCode:     (body) => apiRequest("/api/auth/resend-code",    { method: "POST", body }),
  forgotPassword: (body) => apiRequest("/api/auth/forgot-password",{ method: "POST", body }),
  resetPassword:  (body) => apiRequest("/api/auth/reset-password", { method: "POST", body }),
};

// ─── VENDORS ─────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list:          (category, coords) => {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (coords?.lat != null) { params.set("lat", coords.lat); params.set("lng", coords.lng); }
    const qs = params.toString();
    return apiRequest(`/api/vendors${qs ? "?" + qs : ""}`);
  },
  get:           (id)        => apiRequest(`/api/vendors/${id}`),
  myProfile:     ()          => apiRequest("/api/vendors/me/profile"),
  updateProfile: (body)      => apiRequest("/api/vendors/me/profile", { method: "PATCH", body }),
  uploadMenuPhoto:  (file)   => apiUpload("/api/vendors/me/menu/upload-photo", file),
  uploadCoverPhoto: (file)   => apiUpload("/api/vendors/me/cover-photo", file),
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

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createStripeIntent: (amount) => apiRequest("/api/payments/stripe/intent", { method: "POST", body: { amount } }),
};

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  submit:       (orderId, body) => apiRequest(`/api/orders/${orderId}/review`, { method: "POST", body }),
  forVendor:    (vendorId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/vendors/${vendorId}/reviews${q ? "?" + q : ""}`);
  },
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