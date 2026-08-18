import { apiRequest } from "./api/index.js";

// Converts the VAPID public key (base64url) into the Uint8Array format
// the Push API's applicationServerKey option expects.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the service worker (if needed), asks for notification permission,
 * subscribes to push, and saves the subscription against the logged-in user.
 * Safe to call multiple times — it's a no-op if already subscribed or unsupported.
 */
export async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  if (Notification.permission === "denied") {
    return { ok: false, reason: "denied" };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Already subscribed on this device — just make sure the backend has it
      // (covers the case of a new login on an already-subscribed browser).
      await apiRequest("/api/push/subscribe", { method: "POST", body: { subscription: existing } });
      return { ok: true, alreadySubscribed: true };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: permission };
    }

    const { publicKey } = await apiRequest("/api/push/vapid-public-key");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await apiRequest("/api/push/subscribe", { method: "POST", body: { subscription } });
    return { ok: true };
  } catch (err) {
    console.error("Push subscribe failed:", err.message);
    return { ok: false, reason: "error", error: err };
  }
}

/** Unsubscribes this device from push — call on logout if you want a clean break. */
export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return;

    await apiRequest("/api/push/unsubscribe", { method: "POST", body: { endpoint: existing.endpoint } });
    await existing.unsubscribe();
  } catch (err) {
    console.error("Push unsubscribe failed:", err.message);
  }
}