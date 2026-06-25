import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['/favicon.svg', '/icons/*.png'], // Absolute paths fix the Android Manifest download error
      manifest: {
        name: 'Kivo — Food Delivery',
        short_name: 'Kivo',
        description: 'Order food from your favourite local restaurants. Fast delivery across Tanzania.',
        theme_color: '#e53935',
        background_color: '#e53935',  // red splash screen on Android
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'en',
        dir: 'ltr',
        icons: [
          // Regular icons — any purpose
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // Maskable icon — separate entry, Android adaptive icons
          // Logo kept within the center 80% safe zone
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Browse Restaurants',
            short_name: 'Browse',
            url: '/?source=pwa',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            url: '/?source=pwa&screen=orders',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['food', 'lifestyle', 'shopping'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // 1. Forces your Render production domain straight to the live network
          {
            urlPattern: /^https:\/\/kivo-backend-9h1x\.onrender\.com\/.*/,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'order-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retries order placement later if network cuts out
                }
              }
            }
          },
          // 2. Local fallback api rule for any relative routing setups
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          // 3. Mapbox Tiles
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          // 4. Cloudinary Images
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
            },
          },
          // 5. Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})