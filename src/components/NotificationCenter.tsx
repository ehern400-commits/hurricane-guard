import { useEffect } from "react";
import { BellRing, ListChecks, X } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { progress } from "../logic/checklist";
import { timeAgo } from "../logic/format";
import { Badge } from "./ui";
import type { ChecklistItem } from "../types";

/** In-app notification center. Distinguishes official / cached / demo / app reminders. */
export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { alerts, net } = useApp();
  const { t, lang } = useI18n();
  const items = useTable<ChecklistItem>("checklist");
  const p = progress(items ?? []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kindLabel =
    alerts.origin === "demo" ? t("notif.demo") : alerts.origin === "cached" ? t("notif.cached") : t("notif.official");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("notif.title")}>
      <div className="safe-top h-full w-full max-w-sm overflow-y-auto bg-mist p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("notif.title")}</h2>
          <button onClick={onClose} className="grid size-11 place-items-center rounded-xl hover:bg-navy/5" aria-label={t("common.close")}>
            <X aria-hidden />
          </button>
        </div>
        {net === "offline" && <p className="mb-3 rounded-xl bg-warn/15 p-3 text-sm text-amber-900">{t("notif.noPush")}</p>}
        <ul className="space-y-2">
          {(alerts.data ?? []).map((a) => (
            <li key={a.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <BellRing size={16} className="text-danger" aria-hidden />
                <Badge tone={alerts.origin === "demo" ? "navy" : alerts.origin === "cached" ? "warn" : "danger"}>{kindLabel}</Badge>
              </div>
              <p className="font-semibold">{a.headline}</p>
              <p className="text-xs text-navy/60">
                {a.senderName} · {timeAgo(a.sent, lang)}
              </p>
            </li>
          ))}
          {p.pct < 100 && items && (
            <li className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <ListChecks size={16} className="text-teal" aria-hidden />
                <Badge tone="teal">{t("notif.app")}</Badge>
              </div>
              <p className="text-sm">{t("notif.remindChecklist", { pct: p.pct })}</p>
            </li>
          )}
          {!alerts.data?.length && p.pct === 100 && <li className="text-sm text-navy/60">{t("notif.empty")}</li>}
        </ul>
      </div>
    </div>
  );
}
