import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['/favicon.svg', '/icons/*.png'],
      manifest: {
        name: 'Kivo — Food Delivery',
        short_name: 'Kivo',
        description: 'Order food from your favourite local restaurants. Fast delivery across Tanzania.',
        theme_color: '#e53935',
        background_color: '#e53935',  
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'en',
        dir: 'ltr',
        icons: [
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
          // 1. BULLETPROOF CATCH-ALL: This function intercepts EVERY request and completely 
          // exempts anything going to Render or containing /api/ from being cached or blocked.
          {
            urlPattern: ({ url }) => {
              const isRenderBackend = url.hostname.includes('kivo-backend-9h1x.onrender.com');
              const isLocalApiPath = url.pathname.startsWith('/api/');
              return isRenderBackend || isLocalApiPath;
            },
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'order-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          // 2. Mapbox Tiles
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          // 3. Cloudinary Images
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
            },
          },
          // 4. Google Fonts
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