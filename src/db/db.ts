// Small, dependency-free IndexedDB layer.
// Why not Dexie? We only need get/put/delete/getAll on a few stores; ~80 lines
// is easier for the whole team to read and debug during a 24h hackathon.
// Every write notifies subscribers so React hooks re-render (see hooks/useTable).

export const STORES = [
  "kv", // settings + cached API responses (key → value)
  "checklist",
  "contacts",
  "statuses",
  "syncQueue",
  "places",
] as const;
export type StoreName = (typeof STORES)[number];

const DB_NAME = "hurricane-guard";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, name === "kv" ? undefined : { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

// ---- change notifications ----
type Listener = (store: StoreName) => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(store: StoreName) {
  listeners.forEach((l) => l(store));
}

// ---- table API (stores with keyPath "id") ----
export function table<T extends { id: string }>(name: Exclude<StoreName, "kv">) {
  return {
    getAll: () => run<T[]>(name, "readonly", (s) => s.getAll()),
    get: (id: string) => run<T | undefined>(name, "readonly", (s) => s.get(id)),
    put: async (item: T) => {
      await run(name, "readwrite", (s) => s.put(item));
      emit(name);
    },
    bulkPut: async (items: T[]) => {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(name, "readwrite");
        items.forEach((i) => tx.objectStore(name).put(i));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      emit(name);
    },
    delete: async (id: string) => {
      await run(name, "readwrite", (s) => s.delete(id));
      emit(name);
    },
    clear: async () => {
      await run(name, "readwrite", (s) => s.clear());
      emit(name);
    },
  };
}

// ---- key/value API ----
export const kv = {
  get: <T>(key: string) => run<T | undefined>("kv", "readonly", (s) => s.get(key)),
  set: async (key: string, value: unknown) => {
    await run("kv", "readwrite", (s) => s.put(value, key));
    emit("kv");
  },
  del: async (key: string) => {
    await run("kv", "readwrite", (s) => s.delete(key));
    emit("kv");
  },
};

/** Cached API response with the time it was fetched. */
export interface Cached<T> {
  data: T;
  fetchedAt: number;
}
export const cache = {
  get: <T>(key: string) => kv.get<Cached<T>>(`cache:${key}`),
  set: <T>(key: string, data: T) => kv.set(`cache:${key}`, { data, fetchedAt: Date.now() } satisfies Cached<T>),
};

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
