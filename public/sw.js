// Service worker minimale per Libroteca: permette di rivedere la libreria
// e le statistiche già caricate anche senza connessione a internet.
//
// Funziona così: ogni volta che apri /libreria o /statistiche mentre sei online,
// salviamo una copia della pagina. Se in futuro apri l'app senza connessione,
// ti mostriamo l'ultima copia salvata invece di un errore. Non permette di
// aggiungere o modificare libri offline: serve solo a poter rivedere l'elenco.

const CACHE_NAME = "libroteca-offline-v1";
const ROTTE_IN_CACHE = ["/libreria", "/statistiche"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ci interessano solo le navigazioni a pagina intera (apertura diretta, refresh):
  // i normali click sui link interni sono gestiti dal router di Next.js e non
  // devono passare da qui.
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);

  // La pagina principale reindirizza sempre a /libreria (o /login): se siamo
  // offline e il reindirizzamento lato server non può avvenire, mandiamo
  // comunque l'utente verso /libreria, dove trova la versione salvata.
  if (url.pathname === "/") {
    event.respondWith(fetch(request).catch(() => Response.redirect("/libreria", 302)));
    return;
  }

  if (!ROTTE_IN_CACHE.includes(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((risposta) => {
        const copia = risposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
        return risposta;
      })
      .catch(async () => {
        const inCache = await caches.match(request);
        return inCache ?? Response.error();
      })
  );
});
