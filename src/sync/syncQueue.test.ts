import { test } from "node:test";
import assert from "node:assert/strict";
import { applyResult, backoffMs, processQueue, resetFailed, MAX_ATTEMPTS, type QueueStore } from "./syncQueue.ts";
import type { SyncQueueItem } from "../types/index.ts";

function memStore(items: SyncQueueItem[]): QueueStore & { items: Map<string, SyncQueueItem> } {
  const map = new Map(items.map((i) => [i.id, i]));
  return {
    items: map,
    getAll: async () => [...map.values()],
    put: async (i) => void map.set(i.id, i),
  };
}
const item = (id: string, state: SyncQueueItem["state"] = "pending", attempts = 0): SyncQueueItem => ({
  id, kind: "family-status", payload: {}, createdAt: Date.now(), attempts, state,
});

test("successful send marks item synced", async () => {
  const s = memStore([item("a")]);
  const r = await processQueue(s, async () => {});
  assert.equal(r.synced, 1);
  assert.equal(s.items.get("a")!.state, "synced");
});

test("failed send stays pending and records error", async () => {
  const s = memStore([item("a")]);
  await processQueue(s, async () => { throw new Error("offline"); });
  assert.equal(s.items.get("a")!.state, "pending");
  assert.equal(s.items.get("a")!.lastError, "offline");
});

test("item becomes failed after MAX_ATTEMPTS and is never marked synced", () => {
  const i = applyResult(item("a", "pending", MAX_ATTEMPTS - 1), false, "x");
  assert.equal(i.state, "failed");
  assert.equal(resetFailed(i).state, "pending");
});

test("local-only and synced items are not re-sent", async () => {
  let sends = 0;
  const s = memStore([item("a", "local"), item("b", "synced")]);
  await processQueue(s, async () => { sends++; });
  assert.equal(sends, 0);
});

test("backoff grows and caps", () => {
  assert.equal(backoffMs(1), 2000);
  assert.equal(backoffMs(3), 8000);
  assert.equal(backoffMs(20), 60000);
});
