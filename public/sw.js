/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'ethiolearn-pro-v3';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/ethiolearn_icon.jpg'
];

// Install Event: Precache crucial shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event: Clean up all legacy and stale caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[Service Worker] Flushing stale cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Bypass dev scripts and dynamic modules
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET requests or WebSockets
  if (request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Never intercept dev server files, source code, node_modules, or API endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.includes('run.app')
  ) {
    return; // Direct browser network fetch
  }

  // SPA navigation handling when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || fetch(request);
      })
    );
    return;
  }

  // Static assets with network-first strategy
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.url.startsWith('http')) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
