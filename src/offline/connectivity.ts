// Real connectivity detection.
// navigator.onLine only says "a network interface is up" — Wi-Fi without internet
// still reports true. So we also ping /health.txt on our own origin (the service
// worker never serves it from cache) with a short timeout.

export type NetState = "online" | "offline" | "checking";

let state: NetState = typeof navigator !== "undefined" && navigator.onLine ? "checking" : "offline";
let forcedOffline = false; // Settings → "Simulate offline" (for testing/demo)
let lastOnlineAt: number | null = null;
const listeners = new Set<() => void>();

function set(next: NetState) {
  if (next === "online") lastOnlineAt = Date.now();
  if (next !== state) {
    state = next;
    listeners.forEach((l) => l());
  }
}

export function getNetState(): NetState {
  return forcedOffline ? "offline" : state;
}
export function isOnline() {
  return getNetState() === "online";
}
export function getLastOnlineAt() {
  return lastOnlineAt;
}
export function subscribeNet(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function setForcedOffline(v: boolean) {
  forcedOffline = v;
  listeners.forEach((l) => l());
}
export function isForcedOffline() {
  return forcedOffline;
}

export async function checkConnectivity(timeoutMs = 4000): Promise<boolean> {
  if (!navigator.onLine) {
    set("offline");
    return false;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`/health.txt?t=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
    const ok = res.ok;
    set(ok ? "online" : "offline");
    return ok;
  } catch {
    set("offline");
    return false;
  } finally {
    clearTimeout(t);
  }
}

/** Fetch with timeout that respects "Simulate offline". Throws when offline. */
export async function netFetch(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  if (forcedOffline) throw new Error("offline (simulated)");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    set("online");
    return res;
  } catch (e) {
    // A failed request is a hint, not proof — confirm with a health check.
    void checkConnectivity();
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export function startConnectivityMonitor(onReconnect: () => void) {
  let was = getNetState();
  const tick = async () => {
    await checkConnectivity();
    const now = getNetState();
    if (was !== "online" && now === "online") onReconnect();
    was = now;
  };
  window.addEventListener("online", tick);
  window.addEventListener("offline", () => set("offline"));
  void tick();
  const id = window.setInterval(tick, 30_000);
  return () => window.clearInterval(id);
}
