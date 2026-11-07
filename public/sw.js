/* Hurricane Guard service worker — hand-written so the team can read it.
 *
 * Strategy
 *  - App shell (HTML/JS/CSS/icons): cached so the app OPENS with no internet.
 *  - Page navigations: network-first (get updates), fall back to cached index.html.
 *  - Same-origin static files: cache-first (they have content hashes in names).
 *  - /health.txt and /api/*: network only (connectivity checks must be real;
 *    API data is cached in IndexedDB by the app, with timestamps).
 *  - Cross-origin (NWS, NHC, map tiles): not touched. Map tiles are NOT cached
 *    (OpenStreetMap's tile policy forbids bulk offline downloading).
 *
 * Bump VERSION to force every client to drop old caches.
 */
const VERSION = "hg-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The page sends us the list of files it loaded so the first visit is enough.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(VERSION).then((c) =>
        Promise.all(
          event.data.urls
            .filter((u) => typeof u === "string" && u.startsWith(self.location.origin))
            .filter((u) => !u.includes("/health.txt") && !u.includes("/api/"))
            .map((u) => c.add(u).catch(() => undefined)),
        ),
      ),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through
  if (url.pathname === "/health.txt" || url.pathname.startsWith("/api/")) return; // network only

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/")) || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
