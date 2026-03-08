// GDS Ottawa PWA - Service Worker
// Version 1.0.0

const CACHE_NAME = 'gds-pwa-v1.0.0';
const RUNTIME_CACHE = 'gds-runtime-v1.0.0';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600;700&display=swap'
];

// Install event - cache core files
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old caches
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API calls differently (network first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Handle images with cache first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // For everything else, use cache first with network fallback
  event.respondWith(cacheFirst(request));
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache the new response if it's valid
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline page or fallback
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Network first strategy (for dynamic content/API calls)
async function networkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Network failed, serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Both failed
    return new Response('Offline - No cached data available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from GDS',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'call',
        title: 'Call Now',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GDS Ottawa', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'call') {
    // Open phone dialer
    event.waitUntil(
      clients.openWindow('tel:3437778893')
    );
  } else {
    // Open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync (for future use)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  // Check for new content/updates
  console.log('[SW] Checking for updates...');
  
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    
    // Compare versions and notify if needed
    // This is placeholder - implement your version checking logic
  } catch (error) {
    console.error('[SW] Update check failed:', error);
  }
}

// Listen for messages from the app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[SW] Service Worker loaded - Version:', CACHE_NAME);
