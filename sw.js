var CACHE_NAME = 'pantryspark-v3';

var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-48.png',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png'
];

// INSTALL: precache all core app resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('PantrySpark SW: Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// ACTIVATE: delete old caches, claim clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(name) {
            return name !== CACHE_NAME;
          }).map(function(name) {
            console.log('PantrySpark SW: Removing old cache', name);
            return caches.delete(name);
          })
        );
      })
      .then(function() {
        console.log('PantrySpark SW: Claiming clients');
        return self.clients.claim();
      })
  );
});

// FETCH: network-first for HTML, cache-first for static assets
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external API calls — don't cache these
  if (url.indexOf('api.pexels.com') !== -1 ||
      url.indexOf('api.anthropic.com') !== -1 ||
      url.indexOf('api.unsplash.com') !== -1 ||
      url.indexOf('fonts.googleapis.com') !== -1 ||
      url.indexOf('fonts.gstatic.com') !== -1 ||
      url.indexOf('cdnjs.cloudflare.com') !== -1) {
    return;
  }

  // For HTML requests: network first, fall back to cache
  if (request.headers.get('Accept') && request.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (response && response.status === 200) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cachedResponse) {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // For all other requests (images, JSON, etc): cache first, fall back to network
  event.respondWith(
    caches.match(request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then(function(response) {
          if (response && response.status === 200 && response.type === 'basic') {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(function() {
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
