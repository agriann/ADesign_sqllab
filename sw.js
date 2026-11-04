/* SQLLab · Service Worker · cache-first para toda la app */
const CACHE_NAME = 'sqllab-v1.0.1';
const ASSETS = [
  './sqllab.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Instalación: precachear los assets del app shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activación: limpiar versiones viejas del cache */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first, con fallback a red */
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;

      return fetch(event.request).then(response => {
        /* Cachear solo respuestas válidas del mismo origen */
        if(response.ok && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        /* Sin red y sin cache: si es navegación, devolver el HTML */
        if(event.request.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});
