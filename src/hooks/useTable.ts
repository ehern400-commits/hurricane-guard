import { useEffect, useState } from "react";
import { subscribe, table, type StoreName } from "../db/db";

/** Live view of an IndexedDB store: re-reads whenever that store changes. */
export function useTable<T extends { id: string }>(name: Exclude<StoreName, "kv">) {
  const [rows, setRows] = useState<T[] | null>(null);
  useEffect(() => {
    let alive = true;
    const t = table<T>(name);
    const load = () =>
      t.getAll().then((r) => alive && setRows(r)).catch(() => alive && setRows([]));
    void load();
    const off = subscribe((s) => s === name && void load());
    return () => {
      alive = false;
      off();
    };
  }, [name]);
  return rows;
}
