import { Link } from "react-router-dom";
import { RefreshCw, ScanSearch } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { StormCard } from "../components/StormCard";
import { Button, Card, ExtLink, Freshness, PageHeader } from "../components/ui";
import { OFFICIAL_SOURCES } from "../data/resources";

export default function Storms() {
  const { storms, refresh, refreshing, net } = useApp();
  const { t } = useI18n();

  return (
    <div>
      <PageHeader
        title={t("storms.title")}
        action={
          <Button variant="secondary" onClick={() => void refresh()} disabled={refreshing || net === "offline"}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden /> {t("common.refresh")}
          </Button>
        }
      />

      {storms.origin === "cached" && (
        <p className="mb-3 rounded-xl bg-warn/15 p-3 text-sm font-medium text-amber-900">{t("storms.offTitle")} — {t("stale.warning")}</p>
      )}

      {storms.data === null ? (
        <Card><p className="text-sm">{storms.error ? t("common.unavailable") : net === "offline" ? t("net.never") : t("common.loading")}</p></Card>
      ) : storms.data.length === 0 ? (
        <Card><p className="text-sm">{t("home.noStorms")}</p></Card>
      ) : (
        <div className="space-y-3">
          {storms.data.map((s) => <StormCard key={s.id} s={s} detailed />)}
        </div>
      )}
      <Freshness fetchedAt={storms.fetchedAt} origin={storms.origin} />

      <Link to="/storms/check" className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl bg-navy p-3 font-semibold text-white">
        <ScanSearch className="text-teal" aria-hidden />
        <span className="flex-1">{t("check.title")}<span className="block text-xs font-normal text-white/70">{t("check.subtitle")}</span></span>
      </Link>

      <Card className="mt-4">
        <p className="mb-2 text-xs text-navy/60">{t("storms.limits")}</p>
        <ul className="space-y-1 text-sm">
          {OFFICIAL_SOURCES.slice(0, 3).map((r) => (
            <li key={r.url}><ExtLink href={r.url}>{r.name}</ExtLink></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
