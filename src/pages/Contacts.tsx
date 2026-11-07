import { useState } from "react";
import { Lock, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { table, uid } from "../db/db";
import { validatePhone } from "../logic/format";
import { EMERGENCY_NUMBERS } from "../data/resources";
import { Button, Card, Input, PageHeader, SectionTitle } from "../components/ui";
import type { EmergencyContact } from "../types";

const store = table<EmergencyContact>("contacts");
const blank = { name: "", relationship: "", phone: "", notes: "" };

// Contacts are personal data: they stay in IndexedDB on this device and are
// intentionally NOT added to the sync queue.
export default function Contacts() {
  const { t } = useI18n();
  const contacts = useTable<EmergencyContact>("contacts");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function startEdit(c: EmergencyContact) {
    setForm({ name: c.name, relationship: c.relationship, phone: c.phone, notes: c.notes ?? "" });
    setEditing(c.id);
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return setErr(t("err.name"));
    if (!validatePhone(form.phone)) return setErr(t("err.phone"));
    await store.put({
      id: editing ?? uid("ct"),
      name: form.name.trim().slice(0, 60),
      relationship: form.relationship.trim().slice(0, 40),
      phone: form.phone.trim().slice(0, 20),
      notes: form.notes.trim().slice(0, 200) || undefined,
      updatedAt: Date.now(),
    });
    setForm(blank);
    setEditing(null);
    setOpen(false);
    setErr(null);
  }

  async function remove(c: EmergencyContact) {
    if (window.confirm(t("ct.confirmDelete"))) await store.delete(c.id);
  }

  return (
    <div>
      <PageHeader title={t("ct.title")} />
      <p className="mb-3 flex items-center gap-2 rounded-xl bg-ocean/10 p-3 text-xs text-ocean"><Lock size={14} aria-hidden /> {t("ct.privacy")}</p>

      {open ? (
        <Card className="space-y-3">
          <Input label={t("ct.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} autoComplete="name" />
          <Input label={t("ct.relationship")} value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} maxLength={40} />
          <Input label={t("ct.phone")} type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} autoComplete="tel" />
          <Input label={t("ct.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={200} />
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={save}>{t("common.save")}</Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); setForm(blank); setErr(null); }}>{t("common.cancel")}</Button>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setOpen(true)} className="w-full"><Plus size={16} aria-hidden /> {t("ct.add")}</Button>
      )}

      <ul className="mt-4 space-y-2">
        {contacts?.length === 0 && <li className="text-sm text-navy/60">{t("ct.empty")}</li>}
        {(contacts ?? []).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
          <li key={c.id}>
            <Card className="flex items-center gap-2 !p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-sm text-navy/60">{[c.relationship, c.phone].filter(Boolean).join(" · ")}</p>
                {c.notes && <p className="text-xs text-navy/50">{c.notes}</p>}
              </div>
              <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="grid size-11 place-items-center rounded-xl bg-teal text-white" aria-label={`${t("common.call")} ${c.name}`}>
                <Phone size={18} aria-hidden />
              </a>
              <button onClick={() => startEdit(c)} className="grid size-11 place-items-center rounded-xl text-ocean hover:bg-ocean/10" aria-label={`${t("common.edit")} ${c.name}`}>
                <Pencil size={16} aria-hidden />
              </button>
              <button onClick={() => remove(c)} className="grid size-11 place-items-center rounded-xl text-danger hover:bg-danger/10" aria-label={`${t("common.delete")} ${c.name}`}>
                <Trash2 size={16} aria-hidden />
              </button>
            </Card>
          </li>
        ))}
      </ul>

      <SectionTitle>{t("safety.numbers")}</SectionTitle>
      <Card>
        <ul className="divide-y divide-navy/5">
          {EMERGENCY_NUMBERS.map((n) => (
            <li key={n.name} className="flex items-center justify-between gap-2 py-2 text-sm">
              {n.name}
              <a href={n.url} className="font-bold text-ocean">{n.phone}</a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-navy/60">{t("safety.callNote")}</p>
      </Card>
    </div>
  );
}
