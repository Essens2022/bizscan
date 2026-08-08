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
  // Non intercettare le NAVIGAZIONI (caricamento di un'intera pagina, es. account.html) -
  // solo gli asset secondari (JS, CSS, immagini). Le navigazioni hanno semantica diversa nel
  // browser (redirect, credenziali, gestione errori) ed è la causa reale del crash osservato
  // in console proprio su una navigazione ("Failed to convert value to Response" su
  // account.html) - lasciarle gestire nativamente al browser è la pratica raccomandata ed
  // elimina la classe di problema alla radice, invece di continuare a rincorrere singoli casi.
  if (event.request.mode === 'navigate') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch((err) => {
            if (cached) return cached;
            throw err;
          });
        return cached || networkFetch;
      })
    )
  );
});
