/* ==========================================================================
   AURA Service Worker (service-worker.js)
   Cache-First Shell performance caching and offline media recovery
   ========================================================================== */

const CACHE_NAME = 'aura-cinematic-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/search.js',
    '/js/player.js',
    '/js/queue.js',
    '/js/download.js',
    '/js/library.js',
    '/js/settings.js'
];

// Install Event: Cache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Pre-caching static app shell resources');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event: Clear outdated caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('[Service Worker] Wiping obsolete cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache-First strategy for local scripts/styles; network fallback for API routes
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Bypass caching for python REST API requests or local media downloading routes
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Return custom offline JSON response on net failure
                    return new Response(JSON.stringify({ 
                        error: "Offline mode active. Connection to server lost." 
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // Default Cache-First strategy for static assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Fetch from network and write to dynamic cache
                return fetch(event.request).then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return networkResponse;
                });
            })
    );
});
