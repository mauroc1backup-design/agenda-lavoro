const CACHE = "agenda-v2";
const SUPA = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).then(() =>
    fetch(new Request(SUPA, { mode: "no-cors" })).then(r => c.put(SUPA, r)).catch(() => {})
  )));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Rete prima, cache come ripiego. Le richieste ad altri domini (Supabase, ecc.) non vengono toccate.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isSupa = req.url === SUPA;
  if (!isSupa && new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || (isSupa ? Response.error() : caches.match("./index.html"))))
  );
});
