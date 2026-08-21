// Custom service worker source (vite-plugin-pwa `injectManifest` strategy).
// Vite/workbox-build injects the precache manifest at build time via
// self.__WB_MANIFEST — everything below runs alongside that automatically.

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

self.skipWaiting();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ── Runtime caching (mirrors the previous generateSW config) ─────────────────

// 1. Never cache the backend / API — always hit the network.
//    IMPORTANT: only intercept GET here. Routing POST/PUT/PATCH through the
//    service worker (even with NetworkOnly) forces Workbox to clone/read the
//    request body, which corrupts multipart file uploads (confirmed: photo
//    uploads failed with "Unexpected end of form" until this was removed).
//    Un-intercepted POST requests just go straight to the network as normal.
registerRoute(
  ({ url }) => url.hostname.includes("kivo-backend-9h1x.onrender.com") || url.pathname.startsWith("/api/"),
  new NetworkOnly(),
  "GET"
);

// 2. Mapbox tiles
registerRoute(
  /^https:\/\/api\.mapbox\.com\/.*/,
  new CacheFirst({
    cacheName: "mapbox-tiles",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 })],
  })
);

// 3. Cloudinary images
registerRoute(
  /^https:\/\/res\.cloudinary\.com\/.*/,
  new CacheFirst({
    cacheName: "cloudinary-images",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 604800 })],
  })
);

// 4. Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/,
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 31536000 })],
  })
);

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Web Push ───────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = { title: "Kivo", body: "You have a new notification.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload wasn't JSON — fall back to defaults
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});