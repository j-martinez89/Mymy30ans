// Service worker : le livre fonctionne hors-ligne après la première ouverture.
// Pour publier une mise à jour, change le numéro de version ci-dessous.
const VERSION = "livre-v1";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/page-vierge.jpg",
  "./assets/couverture.jpg",
  "./assets/dos.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/sprites/mymy.png",
  "./assets/sprites/dori.png",
  "./assets/sprites/elona.png",
  "./assets/sprites/jordan.png",
  "./assets/sprites/mathieu.png",
  "./assets/sprites/murphy.png",
  "./assets/sprites/vaia.png",
  "./assets/sprites/groupe.png",
  "./assets/sprites/trophee.png",
  "./assets/sprites/tresor.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res && res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match("./index.html"))));
});
