// The EC-Council challenge core: label an incoming alert as verified / suspicious /
// unverified, explain why in plain language, and keep working offline.
import { useState } from "react";
import { CircleCheck, CircleHelp, ShieldAlert } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { verifyAlert, type SourceKind } from "../logic/verifier";
import { SAMPLE_MESSAGES } from "../data/demo";
import { Button, Card, PageHeader } from "../components/ui";
import type { VerifyResult } from "../types";
import type { I18nKey } from "../i18n/en";

const SOURCES: SourceKind[] = ["official-app", "official-social", "news", "forward", "unknown-sms", "unknown-social", "unknown"];

const LOOK = {
  verified: { Icon: CircleCheck, cls: "bg-teal text-white", ring: "ring-teal" },
  suspicious: { Icon: ShieldAlert, cls: "bg-danger text-white", ring: "ring-danger" },
  unverified: { Icon: CircleHelp, cls: "bg-warn text-navy", ring: "ring-warn" },
} as const;

export default function AlertChecker() {
  const { alerts, storms, net, location } = useApp();
  const { t, tk } = useI18n();
  const [text, setText] = useState("");
  const [source, setSource] = useState<SourceKind>("unknown");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run(txt = text, src = source) {
    if (!txt.trim()) return setErr(t("err.empty"));
    setErr(null);
    const fetchedAt = Math.min(alerts.fetchedAt ?? Infinity, storms.fetchedAt ?? Infinity);
    setResult(
      verifyAlert(
        { text: txt.slice(0, 2000), source: src },
        {
          alerts: alerts.data,
          storms: storms.data,
          dataAgeMs: Number.isFinite(fetchedAt) ? Date.now() - fetchedAt : null,
          offline: net === "offline",
        },
      ),
    );
  }

  const look = result ? LOOK[result.label] : null;

  return (
    <div>
      <PageHeader title={t("check.title")} subtitle={t("check.subtitle")} />
      <Card>
        <label htmlFor="msg" className="sr-only">{t("check.placeholder")}</label>
        <textarea
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("check.placeholder")}
          rows={5}
          maxLength={2000}
          className="w-full rounded-xl border border-navy/15 p-3 text-base outline-none focus:border-teal"
        />
        <label htmlFor="src" className="mt-3 block text-sm font-medium">{t("check.source")}</label>
        <select
          id="src"
          value={source}
          onChange={(e) => setSource(e.target.value as SourceKind)}
          className="mt-1 min-h-11 w-full rounded-xl border border-navy/15 bg-white px-3"
        >
          {SOURCES.map((s) => <option key={s} value={s}>{t(`check.src.${s}` as I18nKey)}</option>)}
        </select>
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
        <Button className="mt-3 w-full" onClick={() => run()}>{t("check.run")}</Button>

        <p className="mt-4 text-xs font-semibold uppercase text-navy/50">{t("check.samples")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLE_MESSAGES.map((m, i) => (
            <button
              key={i}
              onClick={() => {
                setText(m.text);
                setSource(m.source);
                run(m.text, m.source);
              }}
              className="min-h-9 rounded-full bg-ocean/10 px-3 text-xs font-medium text-ocean hover:bg-ocean/20"
            >
              #{i + 1} {m.text.slice(0, 26)}…
            </button>
          ))}
        </div>
      </Card>

      {result && look && (
        <section aria-live="polite" className={`mt-4 overflow-hidden rounded-2xl bg-white shadow ring-2 ${look.ring}`}>
          <div className={`flex items-center gap-3 p-4 ${look.cls}`}>
            <look.Icon size={32} aria-hidden />
            <div>
              <p className="text-2xl font-bold" data-testid="verdict">{t(`check.${result.label}`)}</p>
              <p className="text-sm">{t(`check.${result.label}Help`)}</p>
            </div>
          </div>
          <div className="p-4">
            <h3 className="mb-2 font-semibold">{t("check.why")}</h3>
            <ul className="space-y-2">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${r.weight > 0 ? "bg-teal" : r.weight < 0 ? "bg-danger" : "bg-navy/30"}`} aria-hidden />
                  {tk(r.key, r.params)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-navy/60">
              {t("check.against", {
                alerts: result.checkedAgainst.alertsCount,
                storms: result.checkedAgainst.stormsCount,
                place: location?.label ?? "Miami",
              })}{" "}
              {t("check.disclaimer")}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
