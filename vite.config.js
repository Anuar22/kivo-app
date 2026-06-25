import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Kivo — Food Delivery',
        short_name: 'Kivo',
        description: 'Order food from your favourite local restaurants',
        theme_color: '#e53935',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Browse Restaurants',
            short_name: 'Browse',
            url: '/',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            url: '/?screen=orders',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['food', 'lifestyle', 'shopping'],
      },
      workbox: {
        // Cache all app shell assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Cache API calls for offline resilience
        runtimeCaching: [
          {
            // Cache vendor list for offline browsing
            urlPattern: /\/api\/vendors/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-vendors',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }, // 5 min
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache Mapbox tiles
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }, // 24h
            },
          },
          {
            // Cache Cloudinary images (vendor/menu photos)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 }, // 7 days
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // don't run service worker in dev
      },
    }),
  ],
})
