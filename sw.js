// =====================================================
// SERVICE WORKER - Server Data Manager PWA
// =====================================================

const CACHE_NAME = 'server-data-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/pages.css',
  '/js/app.js',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/sites.js',
  '/js/devices.js',
  '/js/ports.js',
  '/js/otb.js',
  '/js/panels.js',
  '/js/search.js',
  '/js/import.js',
  '/js/export.js',
  '/js/utils.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => console.log('[SW] Cache failed:', err))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first for API, Cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (always network)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({ error: 'Offline - tidak ada koneksi internet' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        ))
    );
    return;
  }

  // For HTML pages - Network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other assets - Cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => {
        if (request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#1e293b"/></svg>', 
            { headers: { 'Content-Type': 'image/svg+xml' } });
        }
      })
  );
});

// Background sync for offline edits
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-port-updates') {
    event.waitUntil(syncOfflineEdits());
  }
});

async function syncOfflineEdits() {
  // Read pending edits from IndexedDB and sync to Supabase
  console.log('[SW] Syncing offline edits...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const options = {
    body: data.body || 'Ada perubahan data baru',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Server Data Manager', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
