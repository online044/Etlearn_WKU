import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'favicon.svg',
          'apple-touch-icon.png',
          'ethiolearn_icon.jpg',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/icon-192-maskable.png',
          'icons/icon-512-maskable.png',
          'icons/apple-touch-icon.png',
          'offline.html',
        ],
        manifest: {
          id: '/',
          name: 'EthioLearn Pro',
          short_name: 'EthioLearn',
          description: 'Bilingual (Amharic/English) AI-powered study platform for Ethiopian university students with past exams, AI flashcards, and university notes.',
          lang: 'en',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
          orientation: 'portrait-primary',
          theme_color: '#0a1128',
          background_color: '#0a1128',
          categories: ['education', 'productivity', 'utilities', 'books'],
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
          ],
          shortcuts: [
            {
              name: 'Study Dashboard',
              short_name: 'Dashboard',
              url: '/?shortcut=dashboard',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
              name: 'Exams & Prep',
              short_name: 'Exams',
              url: '/?shortcut=exams',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
              name: 'Digital Bookstore',
              short_name: 'Books',
              url: '/?shortcut=books',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    server: {
      // HMR is disabled in AI Studio container environment.
      hmr: false,
      watch: null,
    },
  };
});
