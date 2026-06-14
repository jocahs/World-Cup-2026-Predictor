const CACHE_NAME = 'worldcup-predictor-v3';

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/World-Cup-2026-Predictor/',
        '/World-Cup-2026-Predictor/index.html',
        '/World-Cup-2026-Predictor/manifest.json',
        '/World-Cup-2026-Predictor/icon-192.png',
        '/World-Cup-2026-Predictor/icon-512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK FIRST for HTML, CACHE FIRST for assets
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // For HTML pages - go to network first, fallback to cache
  if (url.includes('/World-Cup-2026-Predictor/') && !url.match(/\.(png|jpg|jpeg|svg|json)$/)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh HTML
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For assets (images, manifest) - cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
