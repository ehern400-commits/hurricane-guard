import { Link } from "react-router-dom";
import { BellRing, CloudLightning, HandHeart, ListChecks, Phone, RefreshCw, ScanSearch, Tent } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { progress } from "../logic/checklist";
import { demoDisruptions } from "../data/demo";
import { LocationPicker } from "../components/LocationPicker";
import { StormCard } from "../components/StormCard";
import { Badge, Button, Card, Freshness, ProgressBar, SectionTitle } from "../components/ui";
import type { ChecklistItem } from "../types";
import type { I18nKey } from "../i18n/en";

export default function Home() {
  const { storms, alerts, refresh, refreshing, net, demo } = useApp();
  const { t } = useI18n();
  const items = useTable<ChecklistItem>("checklist");
  const p = progress(items ?? []);

  const quick: { to: string; key: I18nKey; Icon: typeof Tent; tone: string }[] = [
    { to: "/safety/checklist", key: "home.qPrepare", Icon: ListChecks, tone: "bg-teal" },
    { to: "/map", key: "home.qShelters", Icon: Tent, tone: "bg-ocean" },
    { to: "/safety/contacts", key: "home.qContacts", Icon: Phone, tone: "bg-danger" },
    { to: "/safety/donate", key: "home.qDonate", Icon: HandHeart, tone: "bg-teal" },
    { to: "/storms", key: "home.qStorms", Icon: CloudLightning, tone: "bg-navy" },
  ];

  return (
    <div>
      <LocationPicker />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">{t("home.status")}</h2>
          <Button variant="ghost" onClick={() => void refresh()} disabled={refreshing || net === "offline"} aria-label={t("common.refresh")}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden /> {t("common.refresh")}
          </Button>
        </div>
        {storms.data === null ? (
          <p className="text-sm text-navy/70">{storms.error ? t("common.unavailable") : net === "offline" ? t("net.never") : t("common.loading")}</p>
        ) : storms.data.length === 0 ? (
          <p className="text-sm text-navy/70">{t("home.noStorms")}</p>
        ) : (
          <div className="space-y-3">
            {storms.data.slice(0, 2).map((s) => (
              <StormCard key={s.id} s={s} />
            ))}
          </div>
        )}
        <Freshness fetchedAt={storms.fetchedAt} origin={storms.origin} />

        <h3 className="mt-4 text-sm font-semibold">{t("home.alertsHere")}</h3>
        {alerts.data === null ? (
          <p className="text-sm text-navy/70">{alerts.error ? t("common.unavailable") : t("common.loading")}</p>
        ) : alerts.data.length === 0 ? (
          <p className="text-sm text-navy/70">{t("home.noAlerts")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alerts.data.map((a) => (
              <li key={a.id} className="flex gap-2 rounded-xl bg-danger/5 p-3 ring-1 ring-danger/20">
                <BellRing size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                <div>
                  <p className="font-semibold text-danger">{a.event}</p>
                  <p className="text-sm">{a.headline}</p>
                  <p className="text-xs text-navy/60">{a.senderName}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SectionTitle>{t("home.quick")}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {quick.map(({ to, key, Icon, tone }) => (
          <Link key={to} to={to} className="flex min-h-24 flex-col justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-navy/5 hover:ring-teal">
            <span className={`grid size-10 place-items-center rounded-xl text-white ${tone}`}>
              <Icon size={20} aria-hidden />
            </span>
            <span className="font-semibold leading-tight">{t(key)}</span>
          </Link>
        ))}
      </div>
      <Link to="/storms/check" className="mt-3 flex min-h-14 items-center gap-3 rounded-2xl bg-navy p-3 font-semibold text-white">
        <ScanSearch className="text-teal" aria-hidden /> {t("home.qCheck")}
      </Link>

      <SectionTitle action={<Link to="/safety/checklist" className="text-sm font-semibold text-ocean">{t("common.seeAll")}</Link>}>
        {t("home.progress")}
      </SectionTitle>
      <Card>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-3xl font-bold text-teal">{p.pct}%</span>
          <span className="text-sm text-navy/70">{t("home.progressText", { done: p.done, total: p.total })}</span>
        </div>
        <ProgressBar pct={p.pct} label={t("home.progress")} />
      </Card>

      <SectionTitle action={<Link to="/impact" className="text-sm font-semibold text-ocean">{t("common.seeAll")}</Link>}>
        {t("home.ripple")}
      </SectionTitle>
      <Card>
        {demo ? (
          <ul className="space-y-2">
            {demoDisruptions().slice(0, 2).map((d) => (
              <li key={d.id} className="text-sm">
                <Badge tone="navy">{t("demo.tag")}</Badge> <span className="font-medium">{d.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy/70">{t("impact.subtitle")}</p>
        )}
      </Card>

      <p className="mt-6 rounded-xl bg-navy/5 p-3 text-xs text-navy/70">{t("home.disclaimer")}</p>
    </div>
  );
}
