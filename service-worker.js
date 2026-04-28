const CACHE_NAME = 'llk-cache-v19';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/images/l-l_applogo.png',
  './assets/images/l-l_background.png',
  './assets/images/l-l_startup_image.png',
  './VIBE/content.js',
  './VIBE/index.html',
  './board-game/content.js',
  './board-game/index.html',
  './board-game/assets/images/board.png',
  './board-game/assets/audio/dicedrop.wav',
  './board-game/assets/audio/spinwheelstart.wav',
  './board-game/assets/audio/spinwheelstop.wav',
  './board-game/assets/audio/timerstop.wav',
  './daredice/dice.html',
  './daredice/dice.css',
  './daredice/dice.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
