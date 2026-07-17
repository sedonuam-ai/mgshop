// SAME GLOBAL SERVICES — Gestion Stock & Ventes
// Service worker : réseau en priorité (pour toujours avoir la dernière version),
// avec repli automatique sur le cache si hors connexion.

const CACHE_NAME = "sgs-stock-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Réseau prioritaire : toujours essayer la version la plus récente en premier.
// { cache: "no-store" } force le navigateur à ignorer aussi le cache HTTP normal
// (GitHub Pages envoie des en-têtes de cache qui, sinon, renverraient une ancienne version
// même si le service worker demande bien le réseau).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
