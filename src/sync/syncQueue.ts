// Synchronization queue.
//
// Every change the user makes is FIRST saved to IndexedDB (so it survives offline,
// refreshes and closing the app). If a sync server is configured (VITE_SYNC_URL),
// the change is also queued here and pushed when the network is reachable.
//
// States shown in the UI:
//   local   → saved on this device; no sync server configured
//   pending → waiting to be sent (offline, or retrying)
//   synced  → server acknowledged it (HTTP 2xx)
//   failed  → gave up after MAX_ATTEMPTS; user can retry
//
// Conflict strategy (kept deliberately simple):
//   - Family statuses are append-only events → no conflicts possible.
//   - Checklist items and contacts carry `updatedAt`; the server should keep
//     the record with the newest updatedAt (last-write-wins).
// We NEVER mark something "synced" unless the server returned 2xx.

import type { SyncQueueItem, SyncState } from "../types";

export const MAX_ATTEMPTS = 5;

export interface QueueStore {
  getAll(): Promise<SyncQueueItem[]>;
  put(item: SyncQueueItem): Promise<void>;
}

export type Sender = (item: SyncQueueItem) => Promise<void>; // throws on failure

/** Exponential backoff in ms: 2s, 4s, 8s, 16s... capped at 60s. */
export function backoffMs(attempts: number) {
  return Math.min(60_000, 2_000 * 2 ** Math.max(0, attempts - 1));
}

export function initialState(hasServer: boolean): SyncState {
  return hasServer ? "pending" : "local";
}

/** Pure transition used by processQueue (and unit-tested). */
export function applyResult(item: SyncQueueItem, ok: boolean, error?: string): SyncQueueItem {
  if (ok) return { ...item, state: "synced", attempts: item.attempts + 1, lastError: undefined };
  const attempts = item.attempts + 1;
  return { ...item, attempts, lastError: error, state: attempts >= MAX_ATTEMPTS ? "failed" : "pending" };
}

/** Send every pending item. Returns counts so the UI can show a status. */
export async function processQueue(store: QueueStore, send: Sender) {
  const items = (await store.getAll()).filter((i) => i.state === "pending");
  let synced = 0;
  let failed = 0;
  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await send(item);
      await store.put(applyResult(item, true));
      synced++;
    } catch (e) {
      const next = applyResult(item, false, e instanceof Error ? e.message : String(e));
      await store.put(next);
      failed++;
    }
  }
  return { attempted: items.length, synced, failed };
}

/** Let the user manually retry items that reached MAX_ATTEMPTS. */
export function resetFailed(item: SyncQueueItem): SyncQueueItem {
  return item.state === "failed" ? { ...item, state: "pending", attempts: 0 } : item;
}
