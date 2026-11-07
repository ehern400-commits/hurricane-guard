// Registers /sw.js (production only — in `npm run dev` a service worker would
// cache stale dev files and confuse everyone).
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      // Tell the SW to cache every file this page already loaded (hashed JS/CSS
      // chunks), so the very first visit is enough to work offline afterwards.
      const urls = [
        location.origin + "/",
        ...performance.getEntriesByType("resource").map((e) => e.name),
      ].filter((u) => u.startsWith(location.origin));
      (reg.active ?? navigator.serviceWorker.controller)?.postMessage({ type: "CACHE_URLS", urls });
    } catch (e) {
      console.warn("[HurricaneGuard] service worker registration failed", e);
    }
  });
}
