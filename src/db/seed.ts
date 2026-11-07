import { kv, table } from "./db";
import { defaultChecklist } from "../logic/checklist";
import type { ChecklistItem } from "../types";

/** First-run setup: create the default checklist once (never overwrites user data). */
export async function seedOnce() {
  if (await kv.get<boolean>("seeded.v1")) return;
  const existing = await table<ChecklistItem>("checklist").getAll();
  if (!existing.length) await table<ChecklistItem>("checklist").bulkPut(defaultChecklist());
  await kv.set("seeded.v1", true);
}
