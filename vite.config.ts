import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null, // SW registration explicitly handled via virtual:pwa-register in main.tsx
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
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
          name: 'EthioLearn',
          short_name: 'ET_Learn',
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
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
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
              src: '/pwa-512x512.png',
              sizes: '512x512',
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
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
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
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Exams & Prep',
              short_name: 'Exams',
              url: '/?shortcut=exams',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Digital Bookstore',
              short_name: 'Books',
              url: '/?shortcut=books',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
          runtimeCaching: [
            {
              // Google Fonts stylesheets
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
              // Google Fonts webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Public static images and PDFs from Supabase Storage only (never private rest/auth endpoints)
              urlPattern: /.*supabase\.co\/storage\/v1\/object\/public\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-public-storage-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
                },
                cacheableResponse: {
                  statuses: [200], // Strictly 200 only, never error responses
                },
              },
            },
            {
              // Public content read APIs ONLY (never caches student profiles, auth tokens, payments, or private endpoints)
              urlPattern: /^\/api\/(?:books|exams|announcements|health).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-public-content-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
                },
                cacheableResponse: {
                  statuses: [200], // Only cache successful 200 responses to avoid caching error pages
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
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist')) return 'vendor-pdf';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            }
          }
        }
      }
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
