const CACHE_NAME = "linguabloom-v51";
const ASSETS = [
  "language-learning.html",
  "language-select.html",
  "levels.html",
  "lesson.html",
  "linguabloom.css",
  "linguabloom.js",
  "linguabloom.webmanifest",
  "../logos/RSlogoUPDATED.png",
  "languageGlobes.json",
  "languageMaps_debug.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Network-first for HTML/CSS/JS so updates are always reflected immediately
  const url = new URL(event.request.url);
  const isAsset = [".html", ".css", ".js"].some(ext => url.pathname.endsWith(ext));
  if (isAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // Cache-first for JSON/images
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});