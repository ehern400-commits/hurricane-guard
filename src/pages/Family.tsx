import { useState } from "react";
import { CircleCheck, LifeBuoy, MessageSquare, Route, TriangleAlert } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { table, uid } from "../db/db";
import { enqueue, hasSyncServer, retryFailed } from "../sync/syncRunner";
import { fmtDateTime } from "../logic/format";
import { Badge, Button, Card, PageHeader, SectionTitle } from "../components/ui";
import type { FamilyStatus, FamilyStatusKind, SyncQueueItem, SyncState } from "../types";
import type { I18nKey } from "../i18n/en";

const store = table<FamilyStatus>("statuses");
const OPTIONS: { kind: FamilyStatusKind; Icon: typeof LifeBuoy; cls: string }[] = [
  { kind: "safe", Icon: CircleCheck, cls: "bg-teal" },
  { kind: "assistance", Icon: LifeBuoy, cls: "bg-danger" },
  { kind: "evacuating", Icon: Route, cls: "bg-warn !text-navy" },
];
const SYNC_TONE: Record<SyncState, "gray" | "warn" | "teal" | "danger"> = { local: "gray", pending: "warn", synced: "teal", failed: "danger" };

export default function Family() {
  const { t, lang } = useI18n();
  const statuses = useTable<FamilyStatus>("statuses");
  const q = useTable<SyncQueueItem>("syncQueue");
  const [note, setNote] = useState("");

  async function record(kind: FamilyStatusKind) {
    const id = uid("st");
    const sync = await enqueue("family-status", { kind, note: note.trim() || undefined }, `q-${id}`);
    await store.put({ id, kind, note: note.trim().slice(0, 140) || undefined, createdAt: Date.now(), sync });
    setNote("");
  }

  // The true sync state lives in the queue; the status row keeps the initial one.
  const stateOf = (s: FamilyStatus): SyncState => q?.find((x) => x.id === `q-${s.id}`)?.state ?? s.sync;
  const latest = [...(statuses ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  const smsBody = latest[0]
    ? `${t(`fam.${latest[0].kind}` as I18nKey)}${latest[0].note ? ` — ${latest[0].note}` : ""} (${fmtDateTime(latest[0].createdAt, lang)})`
    : "";

  return (
    <div>
      <PageHeader title={t("fam.title")} subtitle={t("fam.subtitle")} />
      <p className="mb-3 flex gap-2 rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger" role="note">
        <TriangleAlert size={18} className="shrink-0" aria-hidden /> {t("fam.notice")}
      </p>
      <Card className="space-y-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("fam.note")}
          aria-label={t("fam.note")}
          maxLength={140}
          className="min-h-11 w-full rounded-xl border border-navy/15 px-3"
        />
        <div className="grid gap-2 sm:grid-cols-3">
          {OPTIONS.map(({ kind, Icon, cls }) => (
            <button key={kind} onClick={() => record(kind)} className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white ${cls}`}>
              <Icon aria-hidden /> {t(`fam.${kind}` as I18nKey)}
            </button>
          ))}
        </div>
        {!hasSyncServer && <p className="text-xs text-navy/60">{t("sync.noServer")}</p>}
        {latest[0] && (
          <a
            href={`sms:?&body=${encodeURIComponent(smsBody)}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ocean/10 px-3 text-sm font-semibold text-ocean"
          >
            <MessageSquare size={16} aria-hidden /> {t("fam.share")}
          </a>
        )}
      </Card>

      <SectionTitle action={q?.some((x) => x.state === "failed") ? <Button variant="ghost" onClick={() => void retryFailed()}>{t("sync.retry")}</Button> : undefined}>
        {t("fam.history")}
      </SectionTitle>
      <ul className="space-y-2">
        {latest.map((s) => {
          const st = stateOf(s);
          return (
            <li key={s.id}>
              <Card className="!p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{t(`fam.${s.kind}` as I18nKey)}</p>
                  <Badge tone={SYNC_TONE[st]}>{t(`sync.${st}` as I18nKey)}</Badge>
                </div>
                {s.note && <p className="text-sm text-navy/70">{s.note}</p>}
                <p className="text-xs text-navy/50">{fmtDateTime(s.createdAt, lang)}</p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
