import type { ChecklistCategory, ChecklistItem } from "../types";

export const DEFAULT_ITEMS: Record<ChecklistCategory, string[]> = {
  supplies: ["water", "food", "flashlights", "batteries", "firstAid", "medication", "powerBanks", "radio"],
  home: ["windows", "chargeDevices", "documents", "outdoorFurniture", "suppliesReady"],
  family: ["contacts", "meetingPoint", "evacPlan", "pets", "medicalInfo"],
};

export function defaultChecklist(now = Date.now()): ChecklistItem[] {
  return (Object.keys(DEFAULT_ITEMS) as ChecklistCategory[]).flatMap((category) =>
    DEFAULT_ITEMS[category].map((k) => ({
      id: `default-${category}-${k}`,
      category,
      labelKey: `cl.${k}`,
      done: false,
      custom: false,
      updatedAt: now,
    })),
  );
}

export function progress(items: ChecklistItem[]) {
  if (!items.length) return { done: 0, total: 0, pct: 0 };
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

export function validateCustomText(text: string): string | null {
  const t = text.trim();
  if (!t) return "err.empty";
  if (t.length > 80) return "err.tooLong";
  return null;
}

/** Built-in items in their intended order, then custom items oldest-first. */
export function sortItems(items: ChecklistItem[]) {
  const order = (i: ChecklistItem) =>
    i.custom ? 1000 + i.updatedAt / 1e13 : DEFAULT_ITEMS[i.category].indexOf(i.labelKey?.replace("cl.", "") ?? "");
  return [...items].sort((a, b) => (a.custom && b.custom ? a.id.localeCompare(b.id) : order(a) - order(b)));
}
