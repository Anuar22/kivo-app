import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})