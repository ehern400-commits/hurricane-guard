import { cache } from "../db/db";
import type { DataOrigin } from "../types";

export interface Loaded<T> {
  data: T | null;
  fetchedAt: number | null;
  origin: DataOrigin | null;
  error: string | null;
}

/**
 * Network-first with IndexedDB fallback.
 * - Success → save to cache, return origin "live".
 * - Failure → return last cached copy with origin "cached" and the error.
 * - Nothing cached → data null + error (UI shows "Information unavailable").
 */
export async function loadWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<Loaded<T>> {
  try {
    const data = await fetcher();
    await cache.set(key, data);
    return { data, fetchedAt: Date.now(), origin: "live", error: null };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const hit = await cache.get<T>(key);
    if (hit) return { data: hit.data, fetchedAt: hit.fetchedAt, origin: "cached", error: err };
    return { data: null, fetchedAt: null, origin: null, error: err };
  }
}

/** Read only the cache (used at startup so the UI is instant, even offline). */
export async function readCache<T>(key: string): Promise<Loaded<T>> {
  const hit = await cache.get<T>(key);
  return hit
    ? { data: hit.data, fetchedAt: hit.fetchedAt, origin: "cached", error: null }
    : { data: null, fetchedAt: null, origin: null, error: null };
}
