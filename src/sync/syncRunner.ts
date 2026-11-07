// Connects the pure sync queue to IndexedDB and the (optional) sync server.
import { table, uid, kv } from "../db/db";
import type { SyncQueueItem, SyncState } from "../types";
import { initialState, processQueue, resetFailed } from "./syncQueue";

const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.trim() || "";
export const hasSyncServer = SYNC_URL.length > 0;
export const queue = table<SyncQueueItem>("syncQueue");

export async function enqueue(kind: SyncQueueItem["kind"], payload: unknown, id = uid("q")): Promise<SyncState> {
  const state = initialState(hasSyncServer);
  await queue.put({ id, kind, payload, createdAt: Date.now(), attempts: 0, state });
  return state;
}

async function send(item: SyncQueueItem) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, kind: item.kind, payload: item.payload, createdAt: item.createdAt }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(t);
  }
}

let running = false;
export async function runSync() {
  if (!hasSyncServer || running) return null;
  running = true;
  try {
    const result = await processQueue(queue, send);
    await kv.set("lastSyncAttempt", { at: Date.now(), ...result });
    return result;
  } finally {
    running = false;
  }
}

export async function retryFailed() {
  const all = await queue.getAll();
  await queue.bulkPut(all.map(resetFailed));
  return runSync();
}
