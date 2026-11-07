import { useEffect, useMemo, useState } from "react";
import { BookOpen, CloudOff, ListChecks, MapPin, Package, Phone, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { useApp } from "../hooks/AppState";
import { GUIDES, type GuideSection } from "../data/guides";
import { HUBS } from "../logic/ripple";
import { demoDisruptions } from "../data/demo";
import { Badge, Card, ExtLink, PageHeader, SectionTitle } from "../components/ui";
import type { ChecklistItem, EmergencyContact, SavedPlace } from "../types";

type Phase = GuideSection["phase"];

/** Emergency guide + offline search across all local content. */
export default function Guide() {
  const { t, tk, lang } = useI18n();
  const { demo } = useApp();
  const [phase, setPhase] = useState<Phase>("before");
  const [q, setQ] = useState("");
  const checklist = useTable<ChecklistItem>("checklist");
  const contacts = useTable<EmergencyContact>("contacts");
  const places = useTable<SavedPlace>("places");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (q) setOpenId(null);
  }, [q]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return null;
    const has = (s: string) => s.toLowerCase().includes(term);
    return {
      guides: GUIDES.filter((g) => has(g.title[lang]) || g.tips[lang].some(has)),
      checklist: (checklist ?? []).filter((c) => has(c.labelKey ? tk(c.labelKey) : c.text ?? "")),
      contacts: (contacts ?? []).filter((c) => has(`${c.name} ${c.relationship} ${c.notes ?? ""}`)),
      places: (places ?? []).filter((p) => has(`${p.label} ${p.address}`)),
      reports: [
        ...HUBS.filter((h) => has(`${h.name} ${h.region} ${h.why[lang]}`)).map((h) => ({ id: h.id, title: h.name, demo: false })),
        ...(demo ? demoDisruptions().filter((d) => has(`${d.title} ${d.summary}`)).map((d) => ({ id: d.id, title: d.title, demo: true })) : []),
      ],
    };
  }, [q, lang, checklist, contacts, places, demo, tk]);

  const total = results ? Object.values(results).reduce((n, a) => n + a.length, 0) : 0;

  return (
    <div>
      <PageHeader title={t("guide.title")} action={<Badge tone="teal"><CloudOff size={12} aria-hidden />{t("guide.offlineOk")}</Badge>} />
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-3 text-navy/40" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("guide.searchPh")}
          aria-label={t("common.search")}
          className="min-h-11 w-full rounded-xl border border-navy/15 bg-white pl-10 pr-3"
        />
      </div>

      {results ? (
        <div className="space-y-4">
          {total === 0 && <p className="text-sm text-navy/60">{t("search.none")}</p>}
          <ResultGroup title={t("search.guides")} icon={<BookOpen size={16} />} items={results.guides.map((g) => ({ id: g.id, label: g.title[lang], onClick: () => { setPhase(g.phase); setOpenId(g.id); setQ(""); } }))} />
          <ResultGroup title={t("search.checklist")} icon={<ListChecks size={16} />} items={results.checklist.map((c) => ({ id: c.id, label: c.labelKey ? tk(c.labelKey) : c.text ?? "", to: "/safety/checklist" }))} />
          <ResultGroup title={t("search.contacts")} icon={<Phone size={16} />} items={results.contacts.map((c) => ({ id: c.id, label: `${c.name} · ${c.phone}`, to: "/safety/contacts" }))} />
          <ResultGroup title={t("search.places")} icon={<MapPin size={16} />} items={results.places.map((p) => ({ id: p.id, label: p.label, to: "/map" }))} />
          <ResultGroup title={t("search.reports")} icon={<Package size={16} />} items={results.reports.map((r) => ({ id: r.id, label: r.demo ? `[DEMO] ${r.title}` : r.title, to: "/impact" }))} />
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 shadow-sm" role="tablist">
            {(["before", "during", "after"] as Phase[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={phase === p}
                onClick={() => setPhase(p)}
                className={`min-h-11 rounded-xl text-sm font-semibold ${phase === p ? "bg-teal text-white" : "text-navy/70"}`}
              >
                {t(`guide.${p}`)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {GUIDES.filter((g) => g.phase === phase).map((g) => (
              <Card key={g.id} className="!p-0">
                <details open={openId === g.id || undefined} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-semibold">
                    {g.title[lang]}
                    <span className="text-navy/40 transition group-open:rotate-90" aria-hidden>›</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {g.tips[lang].map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                    <p className="mt-2 text-xs text-navy/60">{t("common.source")}: <ExtLink href={g.source.url}>{g.source.name}</ExtLink></p>
                  </div>
                </details>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResultGroup({ title, icon, items }: { title: string; icon: React.ReactNode; items: { id: string; label: string; to?: string; onClick?: () => void }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            {i.to ? (
              <Link to={i.to} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm shadow-sm">{icon}{i.label}</Link>
            ) : (
              <button onClick={i.onClick} className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-white px-3 text-left text-sm shadow-sm">{icon}{i.label}</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
