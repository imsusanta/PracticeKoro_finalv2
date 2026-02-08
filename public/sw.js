// Practice Koro Service Worker v2.0 - Auto Update Support
const CACHE_VERSION = 'v2';
const CACHE_NAME = `practice-koro-${CACHE_VERSION}`;
const OFFLINE_URL = '/';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing new version...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Skip waiting to activate immediately - DISABLED FOR AUTO-REFRESH FIX
    // self.skipWaiting();
});

// Activate event - clean old caches and notify clients
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating new version...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith('practice-koro-') && cacheName !== CACHE_NAME)
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => {
            // Notify all clients about the update
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
                });
            });
        })
    );
    // Take control of all clients immediately - DISABLED FOR AUTO-REFRESH FIX
    // self.clients.claim();
});

// Message handler for manual update check
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        self.registration.update();
    }
});

// Fetch event - network-first strategy for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }

    // Skip API/Supabase requests or non-GET requests - always fetch from network
    if (url.hostname.includes('supabase') ||
        url.origin.includes('supabase.co') ||
        url.pathname.startsWith('/api') ||
        request.method !== 'GET') {
        return;
    }

    // For navigation requests, use Network-First strategy
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    // Update cache with the fresh index.html
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // If network fails, return cached version
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((networkResponse) => {
                // Don't cache non-successful responses or external assets
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Only cache GET requests for static assets
                const url = new URL(request.url);
                const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/) ||
                    STATIC_ASSETS.includes(url.pathname);

                if (isStaticAsset) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }

                return networkResponse;
            }).catch(error => {
                console.error('[SW] Fetch failed:', error);
                return new Response('Network error occurred', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Practice Koro', options)
        );
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
