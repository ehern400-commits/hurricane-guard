import { BookOpen, ListChecks, Phone, ScanSearch, Settings, Users } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { progress } from "../logic/checklist";
import { EMERGENCY_NUMBERS } from "../data/resources";
import { Card, NavRow, PageHeader, SectionTitle } from "../components/ui";
import type { ChecklistItem, EmergencyContact } from "../types";

export default function Safety() {
  const { t } = useI18n();
  const items = useTable<ChecklistItem>("checklist");
  const contacts = useTable<EmergencyContact>("contacts");
  const p = progress(items ?? []);

  return (
    <div>
      <PageHeader title={t("safety.title")} />
      <div className="space-y-2">
        <NavRow to="/safety/checklist" icon={<ListChecks aria-hidden />} label={t("safety.checklist")} hint={t("cl.complete", { pct: p.pct })} />
        <NavRow to="/safety/contacts" icon={<Phone aria-hidden />} label={t("safety.contacts")} hint={`${contacts?.length ?? 0}`} />
        <NavRow to="/safety/family" icon={<Users aria-hidden />} label={t("safety.family")} />
        <NavRow to="/safety/guide" icon={<BookOpen aria-hidden />} label={t("safety.guide")} hint={t("guide.offlineOk")} />
        <NavRow to="/storms/check" icon={<ScanSearch aria-hidden />} label={t("safety.checker")} />
        <NavRow to="/settings" icon={<Settings aria-hidden />} label={t("safety.settings")} />
      </div>

      <SectionTitle>{t("safety.numbers")}</SectionTitle>
      <Card>
        <ul className="divide-y divide-navy/5">
          {EMERGENCY_NUMBERS.map((n) => (
            <li key={n.name} className="flex items-center gap-3 py-2">
              <span className="flex-1 text-sm">{n.name}</span>
              <a href={n.url} className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold ${n.phone === "911" ? "bg-danger text-white" : "bg-ocean/10 text-ocean"}`}>
                <Phone size={14} aria-hidden /> {n.phone}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-navy/60">{t("safety.callNote")}</p>
      </Card>
    </div>
  );
}
