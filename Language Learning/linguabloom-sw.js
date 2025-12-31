const CACHE_NAME = "linguabloom-v50";
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
