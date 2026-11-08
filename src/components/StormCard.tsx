import { FlaskConical, Navigation, Wind } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { compass, fmtDateTime } from "../logic/format";
import type { Hurricane } from "../types";
import type { I18nKey } from "../i18n/en";
import { ExtLink, OriginBadge } from "./ui";

export function StormCard({ s, detailed = false }: { s: Hurricane; detailed?: boolean }) {
  const { t, lang } = useI18n();
  const clsKey = `storms.cls.${s.classification}` as I18nKey;
  const clsLabel = t(clsKey) === clsKey ? s.classification : t(clsKey);
  const catCls = s.category && s.category >= 3 ? "bg-danger text-white" : "bg-warn text-navy";
  return (
    <div className="rounded-2xl bg-gradient-to-br from-navy to-ocean p-4 text-white shadow">
      {s.origin === "demo" && (
        <p className="storm-demo-notice mb-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-bold" role="note">
          <FlaskConical size={18} className="mt-0.5 shrink-0" aria-hidden />
          {t("storms.demoNotice")}
        </p>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70">{clsLabel}</p>
          <h3 className="text-2xl font-bold">{s.name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          {s.category && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${catCls}`}>{t("storms.category", { n: s.category })}</span>
          )}
          {/* white pill so the badge stays readable on the dark card */}
          <span className="rounded-full bg-white">
            <OriginBadge origin={s.origin} />
          </span>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-white/70">{t("storms.wind")}</dt>
          <dd className="flex items-center gap-1 text-lg font-bold">
            <Wind size={16} aria-hidden /> {s.windMph != null ? `${s.windMph} mph` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-white/70">{t("storms.movement")}</dt>
          <dd className="flex items-center gap-1 text-lg font-bold">
            <Navigation size={16} aria-hidden style={{ transform: `rotate(${(s.movementDir ?? 0) - 45}deg)` }} />
            {compass(s.movementDir)} {s.movementSpeedMph != null ? `${s.movementSpeedMph} mph` : ""}
          </dd>
        </div>
        {detailed && (
          <>
            <div>
              <dt className="text-white/70">{t("storms.location")}</dt>
              <dd className="font-semibold">
                {s.lat != null && s.lon != null ? `${Math.abs(s.lat).toFixed(1)}°${s.lat >= 0 ? "N" : "S"} ${Math.abs(s.lon).toFixed(1)}°${s.lon <= 0 ? "W" : "E"}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-white/70">{t("storms.pressure")}</dt>
              <dd className="font-semibold">{s.pressureMb != null ? `${s.pressureMb} mb` : "—"}</dd>
            </div>
          </>
        )}
      </dl>
      <p className="mt-3 text-xs text-white/70">{t("common.updated", { when: fmtDateTime(s.lastUpdate, lang) })}</p>
      {detailed && (s.advisoryUrl || s.trackUrl) && (
        <div className="mt-3 flex flex-wrap gap-3 rounded-xl bg-white p-2 text-sm">
          {s.advisoryUrl && <ExtLink href={s.advisoryUrl}>{t("storms.advisory")}</ExtLink>}
          {s.trackUrl && <ExtLink href={s.trackUrl}>{t("storms.track")}</ExtLink>}
        </div>
      )}
    </div>
  );
}
