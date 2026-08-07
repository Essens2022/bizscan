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

// BUG REALE trovato e corretto: la vecchia strategia "cache-first" per gli asset versionati
// (?v=...) si fidava ciecamente della cache senza MAI verificare la rete, partendo dal
// presupposto che ogni deploy generi un numero di versione diverso - falso quando due deploy
// avvengono nello stesso minuto (il timestamp usato ha solo granularità al minuto), cosa
// successa piu' volte oggi durante iterazioni rapide: la seconda modifica riceveva lo STESSO
// URL della prima, e il telefono restava bloccato sul codice vecchio, per sempre, senza mai
// ricontrollare - anche con la modifica correttamente pubblicata su GitHub.
// Ora TUTTO passa prima dalla rete (sempre fresco, mai una versione stantia servita alla
// cieca), con la cache usata SOLO come rete di sicurezza per l'uso offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  // Non intercettare MAI richieste verso altri domini (es. CDN esterni come jsdelivr.net
  // per Supabase JS) - lasciale gestire normalmente dal browser, senza passare dalla
  // cache di questo service worker, che è pensata solo per gli asset di bizscan.it
  if (new URL(url).origin !== self.location.origin) return;

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
