const CACHE_NAME = 'bizscan-shell-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia doppia:
// 1) Asset versionati (?v=...) - come premium-app.js?v=20260725: l'URL stesso
//    garantisce la freschezza (ogni deploy cambia il numero), quindi possiamo
//    servirli istantaneamente dalla cache senza aspettare la rete - stessa
//    tecnica usata dai siti principali (nomi file con hash immutabili).
// 2) Tutto il resto (pagine HTML, richieste senza versione) - rete prima,
//    così il contenuto che può cambiare in qualsiasi momento resta sempre
//    aggiornato, con la cache solo come rete di sicurezza offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  const isVersionedAsset = url.includes('?v=');

  if (isVersionedAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
