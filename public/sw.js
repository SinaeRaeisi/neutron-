const CACHE = "neutron-v1";
const PRECACHE = ["/", "/app", "/login"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API — network-first
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r ?? Response.error()))
    );
    return;
  }

  // Assets — cache-first
  if (/\.(js|css|woff2?|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((r) => {
        if (r) return r;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        });
      })
    );
    return;
  }

  // Pages — network-first with cache fallback
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r ?? caches.match("/app")))
  );
});