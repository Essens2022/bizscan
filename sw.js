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

// Strategia "stale-while-revalidate": risponde SUBITO dalla cache se disponibile (nessuna
// attesa di rete, caricamento rapido anche su connessione lenta/instabile - causa esatta di
// un caricamento lento di alcuni secondi segnalato su rete debole), MA in parallelo fa comunque
// la richiesta di rete e aggiorna la cache per la prossima visita. Cosi' non si ripete mai
// più il bug della cache "bloccata per sempre" (ogni visita si autocorregge sullo sfondo, entro
// una visita in più) - ma nemmeno il rallentamento introdotto forzando SEMPRE l'attesa di rete
// prima ancora di mostrare qualcosa, come faceva la correzione precedente.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  // Non intercettare MAI richieste verso altri domini (es. CDN esterni come jsdelivr.net
  // per Supabase JS) - lasciale gestire normalmente dal browser, senza passare dalla
  // cache di questo service worker, che è pensata solo per gli asset di bizscan.it
  if (new URL(url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch((err) => {
            // BUG REALE corretto: se la risorsa non era già in cache (prima visita a
            // quell'URL) E la rete fallisce anche solo per un istante, "cached" qui è
            // undefined - restituirlo comunque faceva sì che respondWith() ricevesse
            // undefined invece di una vera Response, mandando in crash il service worker
            // ("Failed to convert value to 'Response'"), visto in console proprio così su
            // account.html. Ora, senza nulla in cache a cui appoggiarsi, l'errore di rete
            // viene rilanciato correttamente, lasciando che il browser lo gestisca nel modo
            // normale (pagina di errore/nuovo tentativo), invece di andare in crash.
            if (cached) return cached;
            throw err;
          });
        return cached || networkFetch;
      })
    )
  );
});
