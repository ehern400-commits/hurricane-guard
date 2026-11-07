import { useState } from "react";
import { Check, HardDrive, Plus, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { table, uid } from "../db/db";
import { progress, sortItems, validateCustomText } from "../logic/checklist";
import { enqueue } from "../sync/syncRunner";
import { Card, PageHeader, ProgressBar, SectionTitle } from "../components/ui";
import type { ChecklistCategory, ChecklistItem } from "../types";
import type { I18nKey } from "../i18n/en";

const store = table<ChecklistItem>("checklist");
const CATS: ChecklistCategory[] = ["supplies", "home", "family"];

export default function Checklist() {
  const { t, tk } = useI18n();
  const items = useTable<ChecklistItem>("checklist");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const p = progress(items ?? []);

  async function toggle(i: ChecklistItem) {
    const next = { ...i, done: !i.done, updatedAt: Date.now() };
    await store.put(next); // saved locally first — works offline
    await enqueue("checklist", next, `cl-${i.id}`); // same id → only latest state is queued
  }

  async function add(cat: ChecklistCategory) {
    const text = drafts[cat] ?? "";
    const err = validateCustomText(text);
    setErrors((e) => ({ ...e, [cat]: err }));
    if (err) return;
    const item: ChecklistItem = { id: uid("custom"), category: cat, text: text.trim(), done: false, custom: true, updatedAt: Date.now() };
    await store.put(item);
    await enqueue("checklist", item, `cl-${item.id}`);
    setDrafts((d) => ({ ...d, [cat]: "" }));
  }

  return (
    <div>
      <PageHeader title={t("cl.title")} />
      <Card>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-3xl font-bold text-teal" data-testid="cl-pct">{t("cl.complete", { pct: p.pct })}</span>
          <span className="text-sm text-navy/60">{p.done}/{p.total}</span>
        </div>
        <ProgressBar pct={p.pct} label={t("cl.title")} />
        <p className="mt-2 flex items-center gap-1 text-xs text-navy/60"><HardDrive size={12} aria-hidden /> {t("cl.savedLocal")}</p>
      </Card>

      {CATS.map((cat) => {
        const list = sortItems((items ?? []).filter((i) => i.category === cat));
        const cp = progress(list);
        return (
          <div key={cat}>
            <SectionTitle action={<span className="text-xs text-navy/50">{cp.done}/{cp.total}</span>}>{t(`cl.cat.${cat}` as I18nKey)}</SectionTitle>
            <Card className="!p-2">
              <ul>
                {list.map((i) => {
                  const label = i.labelKey ? tk(i.labelKey) : i.text ?? "";
                  return (
                    <li key={i.id} className="flex items-center gap-1">
                      <button
                        role="checkbox"
                        aria-checked={i.done}
                        onClick={() => toggle(i)}
                        className="flex min-h-12 flex-1 items-center gap-3 rounded-xl px-2 text-left hover:bg-mist"
                      >
                        <span className={`grid size-6 shrink-0 place-items-center rounded-md border-2 ${i.done ? "border-teal bg-teal text-white" : "border-navy/25"}`}>
                          {i.done && <Check size={16} strokeWidth={3} aria-hidden />}
                        </span>
                        <span className={i.done ? "text-navy/50 line-through" : ""}>{label}</span>
                      </button>
                      {i.custom && (
                        <button onClick={() => store.delete(i.id)} className="grid size-11 place-items-center rounded-xl text-danger hover:bg-danger/10" aria-label={`${t("common.delete")}: ${label}`}>
                          <Trash2 size={16} aria-hidden />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <form
                className="mt-1 flex gap-2 p-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  void add(cat);
                }}
              >
                <input
                  value={drafts[cat] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                  placeholder={t("cl.addPh")}
                  aria-label={`${t("cl.addPh")} (${t(`cl.cat.${cat}` as I18nKey)})`}
                  maxLength={100}
                  className="min-h-11 flex-1 rounded-xl border border-navy/15 px-3"
                />
                <button type="submit" className="grid size-11 place-items-center rounded-xl bg-teal text-white" aria-label={t("common.add")}>
                  <Plus size={18} aria-hidden />
                </button>
              </form>
              {errors[cat] && <p className="px-2 pb-1 text-sm text-danger">{tk(errors[cat]!)}</p>}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
