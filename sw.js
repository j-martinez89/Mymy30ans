// Service worker : le livre fonctionne hors-ligne après la première ouverture.
// Pour publier une mise à jour, change le numéro de version ci-dessous.
const VERSION = "livre-v12";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./cave.js","./village.js",
  "./manifest.webmanifest",
  "./assets/page-vierge.jpg",
  "./assets/couverture.jpg",
  "./assets/dos.jpg",
  "./assets/sfx/page.mp3",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/sprites/mymy.png",
  "./assets/sprites/kithim.png",
  "./assets/sprites/kguit.png",
  "./assets/sprites/mymy_run.png",
  "./assets/sprites/dori_run.png",
  "./assets/sprites/jordan_run.png",
  "./assets/sprites/elona_run.png",
  "./assets/sprites/mathieu_run.png",
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
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(url.pathname);
  if (isImage) {
    // images : cache d'abord (elles ne changent pas)
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    })));
  } else {
    // code (html/js/css) : réseau d'abord pour recevoir les mises à jour, cache si hors-ligne
    e.respondWith(fetch(e.request, { cache: "no-cache" }).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html"))));
  }
});
