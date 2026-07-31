// Service Worker BizScan - cache stale-while-revalidate per file statici (HTML/CSS/JS)
// Obiettivo: la SECONDA visita di ogni pagina si carica ISTANTANEAMENTE dalla cache del
// browser stesso, senza nessuna richiesta di rete per HTML/CSS/JS - molto più potente
// del solo prefetch, perché elimina anche il costo di download, non solo lo anticipa.
// Le chiamate a Supabase (dati, autenticazione) NON vengono mai toccate da questo cache -
// restano sempre dirette e fresche, esattamente come oggi.

const CACHE_NAME = 'bizscan-static-v1';
const SUPABASE_HOST = 'fafedftoyztptdiubjmx.supabase.co';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Mai toccare le chiamate a Supabase (dati, autenticazione, crediti) - sempre dirette
  if (url.hostname === SUPABASE_HOST) return;
  // Solo richieste GET, stesso dominio, HTML/CSS/JS statici
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!/\.(html|css|js)(\?|$)/.test(url.pathname) && url.pathname !== '/') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        // Stale-while-revalidate: se in cache, servi ISTANTANEAMENTE quello,
        // aggiornando in background per la prossima visita
        return cached || networkFetch;
      })
    )
  );
});
