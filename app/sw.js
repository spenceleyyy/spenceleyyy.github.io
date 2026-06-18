const CACHE = 'app-shell-v4';
const ASSETS = [
  'index.html',
  'piano-lab.html',
  'language-learning.html',
  'photo-translator.html',
  'gym-login.html',
  'manifest-gym.json',
  'apple-touch-icon.png',
  'logos/gym-icon-120.png',
  'logos/gym-icon-152.png',
  'logos/gym-icon-167.png',
  'logos/gym-icon-180.png',
  'logos/gym-icon-192.png',
  'logos/gym-icon-512.png',
  'logos/gym-icon-1024.png',
  'logos/logo-192.svg',
  'logos/logo-512.svg'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch strategy: try cache first, then network, and update cache for same-origin GET requests
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  evt.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // only cache successful same-origin responses
        if (res && res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // fallback to cached index or empty response for navigation
        if (req.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
