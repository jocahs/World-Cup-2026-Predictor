const CACHE_NAME = 'worldcup-predictor-v1';
const OFFLINE_URL = 'index.html';

// Files to cache for offline access
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'screenshots/screenshot1-phone.jpg',
  'screenshots/screenshot1-tablet.jpg',
  'screenshots/screenshot2-phone.jpg',
  'screenshots/screenshot2-tablet.jpg',
  'screenshots/screenshot3-phone.jpg',
  'screenshots/screenshot3-tablet.jpg'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('[Service Worker] Cache failed:', err))
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests (Google Sheets API)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For HTML requests - network first, fallback to cache
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh version
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback - serve cached index.html
          console.log('[Service Worker] Offline - serving cached page');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For other assets - cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Cache new assets for offline use
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for images
        if (event.request.url.match(/\.(png|jpg|jpeg|svg)$/)) {
          return caches.match('/World-Cup-2026-Predictor/icon-192.png');
        }
        // For API calls, return a simple error response
        return new Response('You are offline. Please check your connection.', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
