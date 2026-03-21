var CACHE_NAME = 'pantryspark-v2';
var urlsToCache = [
  './index.html',
  './manifest.json'
];

// Install — cache core files and activate immediately
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('PantrySpark: Caching core files');
      return cache.addAll(urlsToCache);
    })
  );
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// Activate — clean ALL old caches and take control immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('PantrySpark: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

// Fetch — NETWORK FIRST strategy
// Always tries to get the latest version from the server
// Only falls back to cache if offline
self.addEventListener('fetch', function(event) {
  // Don't cache API calls
  if (event.request.url.indexOf('api.pexels.com') !== -1 ||
      event.request.url.indexOf('api.anthropic.com') !== -1 ||
      event.request.url.indexOf('api.unsplash.com') !== -1) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Got a fresh response — update the cache with it
      if (response && response.status === 200) {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — serve from cache (offline mode)
      return caches.match(event.request).then(function(response) {
        return response || caches.match('./index.html');
      });
    })
  );
});

// Listen for messages from the app to force update
self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
