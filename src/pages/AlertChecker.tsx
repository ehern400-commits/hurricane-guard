// The EC-Council challenge core: label an incoming alert as verified / suspicious /
// unverified, explain why in plain language, and keep working offline.
import { useEffect, useRef, useState } from "react";
import { Camera, CircleCheck, CircleHelp, ShieldAlert, Sparkles } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { verifyAlert, type SourceKind, type VerifyInput } from "../logic/verifier";
import { SAMPLE_MESSAGES } from "../data/demo";
import { Button, Card, PageHeader, ProgressBar } from "../components/ui";
import type { VerifyResult } from "../types";
import type { I18nKey } from "../i18n/en";
import { checkMessage, type CheckResult } from "../lib/offlineChecker";
import { parse } from "exifr";
import { createWorker } from "tesseract.js";
import { findKnownFake, containsAiWatermark, inspectImageLabels, cleanOcrText, isPhotoFar } from "../logic/imageChecks";
import { hashImageFile, preprocessImage } from "../logic/imageCanvas";
import { askAiCheck, type AiOpinion, type AiVerdict } from "../services/aiCheck";

const SOURCES: SourceKind[] = ["official-app", "official-social", "news", "forward", "unknown-sms", "unknown-social", "unknown"];
const PHOTO_FLAGS = [
  "check.flagGarbled",
  "check.flagBlending",
  "check.flagImpossible",
  "check.flagCinematic",
  "check.flagWatermark",
  "check.flagAccount",
] as const;

const LOOK = {
  verified: { Icon: CircleCheck, cls: "bg-teal text-white", ring: "ring-teal" },
  suspicious: { Icon: ShieldAlert, cls: "bg-danger text-white", ring: "ring-danger" },
  unverified: { Icon: CircleHelp, cls: "bg-warn text-navy", ring: "ring-warn" },
} as const;

interface CheckerView extends VerifyResult {
  offline: CheckResult;
  lastSyncedAt: string | null;
}

type PhotoStatus = "ai" | "knownFake" | "old" | "clear";

function isOldPhoto(takenAt?: Date) {
  return Boolean(takenAt && Date.now() - takenAt.getTime() > 7 * 24 * 3600_000);
}

export default function AlertChecker() {
  const { alerts, storms, net, location, demo } = useApp();
  const { t, tk, lang } = useI18n();
  const [text, setText] = useState("");
  const [verifiedText, setVerifiedText] = useState("");
  const [foundText, setFoundText] = useState("");
  const [source, setSource] = useState<SourceKind>("unknown");
  const [result, setResult] = useState<CheckerView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<VerifyInput["photo"]>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus | null>(null);
  const [photoFlags, setPhotoFlags] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState<number | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [aiOpinion, setAiOpinion] = useState<AiOpinion | null>(null);
  const [aiDemo, setAiDemo] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function run(txt = text, src = source, photoInfo = photo, flags = photoFlags) {
    if (!txt.trim()) return setErr(t("err.empty"));
    setErr(null);
    setText(txt);
    setVerifiedText(txt);
    setAiOpinion(null);
    setAiDemo(false);
    setAiError(false);
    const fetchedAt = Math.min(alerts.fetchedAt ?? Infinity, storms.fetchedAt ?? Infinity);
    const hasOfficialCache = alerts.origin !== "demo";
    const lastSyncedAt = !hasOfficialCache || alerts.fetchedAt === null
      ? null
      : new Date(alerts.fetchedAt).toISOString();
    const offline = checkMessage(txt.slice(0, 2000), {
      officialAlerts: (hasOfficialCache ? alerts.data ?? [] : []).map((alert) => ({
        id: alert.id,
        event: alert.event,
        areaDesc: alert.areaDesc,
        expires: alert.expires ?? "",
        sent: alert.sent,
        source: alert.senderName,
      })),
      lastSyncedAt,
    });

    const heuristic = verifyAlert(
      {
        text: txt.slice(0, 2000),
        source: src,
        photo: photoInfo ? { ...photoInfo, userFlags: flags.map((flag) => t(flag as I18nKey)) } : undefined,
      },
      {
        alerts: alerts.data,
        storms: storms.data,
        dataAgeMs: Number.isFinite(fetchedAt) ? Date.now() - fetchedAt : null,
        offline: net !== "online",
        location: location ? { lat: location.lat, lon: location.lon } : null,
      },
    );
    const photoReasons = heuristic.reasons.filter((reason) =>
      reason.key.startsWith("img.") || reason.key.startsWith("v.photo"),
    );
    let label = offline.label;
    if (offline.label !== "suspicious" && photoReasons.some((reason) => reason.weight <= -30)) {
      label = "suspicious";
    }

    let onlineReasons: VerifyResult["reasons"] = [];
    if (net === "online" && !demo) {
      if (label === "verified" && heuristic.label !== "verified") {
        label = heuristic.label;
        onlineReasons = heuristic.reasons;
      } else if (label === "unverified" && heuristic.label === "suspicious") {
        label = "suspicious";
        onlineReasons = heuristic.reasons;
      }
    }

    setResult({
      ...heuristic,
      label,
      reasons: [...photoReasons, ...onlineReasons],
      offline,
      lastSyncedAt,
    });
  }

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    setSelectedPhoto(file);
    setAiOpinion(null);
    setAiDemo(false);
    setAiError(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanError(null);
    setScanProgress(0);
    setFoundText("");
    setResult(null);
    setErr(null);
    setPhoto(undefined);
    setPhotoFlags([]);
    setPhotoStatus(null);

    let photoInfo: NonNullable<VerifyInput["photo"]> = { hasMetadata: false };
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let metadata: Record<string, unknown> = {};
      try {
        metadata = (await parse(file, {
          exif: { pick: ["DateTimeOriginal"] },
          gps: true,
          xmp: true,
        }) ?? {}) as Record<string, unknown>;
      } catch {
        // Continue with byte-level labels and OCR when EXIF/XMP is missing or malformed.
      }

      let takenAt: Date | undefined;
      if (metadata.DateTimeOriginal instanceof Date) takenAt = metadata.DateTimeOriginal;
      else if (typeof metadata.DateTimeOriginal === "string") {
        const normalized = metadata.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) takenAt = parsed;
      }
      const lat = Number.isFinite(metadata.latitude) ? metadata.latitude as number
        : Number.isFinite(metadata.GPSLatitude) ? metadata.GPSLatitude as number : undefined;
      const lon = Number.isFinite(metadata.longitude) ? metadata.longitude as number
        : Number.isFinite(metadata.GPSLongitude) ? metadata.GPSLongitude as number : undefined;
      const labels = inspectImageLabels(bytes, [metadata.DigitalSourceType, metadata.Software]);
      const software = typeof metadata.Software === "string" ? metadata.Software : "";
      const editingSoftware = software.match(/Photoshop|Lightroom|GIMP|Canva|Picsart|Snapseed|FaceApp/i)?.[0];
      const hash = await hashImageFile(file);
      const knownFake = findKnownFake(hash);
      photoInfo = {
        ...(takenAt ? { takenAt } : {}),
        ...(lat !== undefined ? { lat } : {}),
        ...(lon !== undefined ? { lon } : {}),
        hasMetadata: Boolean(takenAt || lat !== undefined || lon !== undefined || labels.aiLabel || labels.contentCredentials || software),
        ...(labels.aiLabel ? { aiLabel: labels.aiLabel } : {}),
        ...(labels.contentCredentials ? { contentCredentials: true } : {}),
        ...(editingSoftware ? { editingSoftware } : {}),
        ...(knownFake ? { knownFake } : {}),
      };
      setPhoto(photoInfo);
      const far = lat !== undefined && lon !== undefined && location
        && isPhotoFar(lat, lon, location.lat, location.lon);
      setPhotoStatus(labels.aiLabel ? "ai" : knownFake ? "knownFake" : isOldPhoto(takenAt) || far ? "old" : "clear");

      const canvas = await preprocessImage(file);
      const worker = await createWorker("eng+spa", undefined, {
        logger: (message) => {
          if (message.status === "recognizing text") setScanProgress(Math.round(message.progress * 100));
        },
      });
      let recognizedText = "";
      try {
        const ocr = await worker.recognize(canvas);
        const lines = (ocr.data.blocks ?? []).flatMap((block) =>
          block.paragraphs.flatMap((paragraph) => paragraph.lines),
        );
        const words = lines.flatMap((line) => line.words);
        const averageConfidence = words.length
          ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length
          : 0;
        const readableWords = words.filter((word) => word.confidence >= 70);
        recognizedText = cleanOcrText(
          lines.map((line) => line.words.filter((word) => word.confidence >= 70).map((word) => word.text).join(" ")).join("\n"),
        );
        const readableTextWords = recognizedText.match(/\p{L}+/gu)?.length ?? 0;
        if (averageConfidence < 60 || readableWords.length < 3 || readableTextWords < 3) {
          setScanError(t("check.photoUnclear"));
          return;
        }
      } finally {
        await worker.terminate();
      }
      setFoundText(recognizedText.slice(0, 2000));
      const aiWatermark = containsAiWatermark(recognizedText);
      if (aiWatermark) {
        photoInfo = { ...photoInfo, aiWatermark: true };
        setPhoto(photoInfo);
        setPhotoStatus("ai");
      }
    } catch {
      setScanError(t("check.photoReadError"));
    } finally {
      setScanProgress(null);
    }
  }

  async function askForAiOpinion() {
    if (!result || net === "offline" || aiLoading || aiError) return;
    setAiLoading(true);
    setAiError(false);
    try {
      const opinion = await askAiCheck({
        text: verifiedText.slice(0, 2000),
        language: lang,
        alerts: (alerts.data ?? []).slice(0, 20)
          .map((alert) => `${alert.event}: ${alert.headline} (${alert.areaDesc})`)
          .join("\n") || "No official alerts currently available.",
        storms: (storms.data ?? []).slice(0, 20)
          .map((storm) => `${storm.name}${storm.category !== null ? `, Category ${storm.category}` : ""}`)
          .join("\n") || "No active storms currently available.",
        photo: selectedPhoto,
      });
      setAiOpinion({ ...opinion, explanation: opinion.explanation.trim() || t("ai.parseFallback") });
      setAiDemo(false);
      setResult((current) => current
        ? { ...current, ...combineAiOpinion(current, opinion.verdict) }
        : current);
    } catch {
      setAiError(true);
      if (demo) {
        const demoOpinion: AiOpinion = {
          verdict: "uncertain",
          redFlags: [t("ai.demoFlag")],
          explanation: t("ai.demoExplanation"),
        };
        setAiOpinion(demoOpinion);
        setAiDemo(true);
        setResult((current) => current
          ? { ...current, ...combineAiOpinion(current, demoOpinion.verdict) }
          : current);
      }
    } finally {
      setAiLoading(false);
    }
  }

  const look = result ? LOOK[result.label] : null;
  const savedAtText = result?.lastSyncedAt
    ? new Date(result.lastSyncedAt).toLocaleString(lang === "zh" ? "zh-Hans" : lang)
    : t("check.neverSaved");
  const photoReason = result?.reasons.find((reason) => reason.key === "img.knownFake");

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
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={scanProgress !== null} onClick={() => cameraInput.current?.click()}>
            <Camera size={18} aria-hidden />{t("check.scanPhoto")}
          </Button>
          <Button type="button" variant="ghost" disabled={scanProgress !== null} onClick={() => galleryInput.current?.click()}>
            {t("check.choosePhoto")}
          </Button>
          <input
            ref={cameraInput}
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            aria-label={t("check.scanPhoto")}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              void scanPhoto(file);
            }}
          />
          <input
            ref={galleryInput}
            className="sr-only"
            type="file"
            accept="image/*"
            aria-label={t("check.choosePhoto")}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              void scanPhoto(file);
            }}
          />
        </div>
        {previewUrl && (
          <div className="mt-3 flex items-start gap-3">
            <img src={previewUrl} alt={t("check.photoPreview")} className="size-20 rounded-xl object-cover ring-1 ring-navy/10" />
            {photo?.knownFake && (
              <div>
                <p className="text-sm font-semibold text-danger">
                  {t("check.photoStatus.knownFake")}: {photo.knownFake.title} ({photo.knownFake.year})
                </p>
                <a href={photo.knownFake.factCheckUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ocean underline">
                  {t("check.photoFactCheck")}
                </a>
              </div>
            )}
          </div>
        )}
        {photoStatus && (
          <Card className="mt-3 border border-navy/10">
            <h2 className="font-semibold">{t("check.photoCheck")}</h2>
            <p className="mt-1 text-sm font-medium">{t(`check.photoStatus.${photoStatus}`)}</p>
            {photoStatus === "clear" && <p className="mt-1 text-xs text-navy/70">{t("check.photoClearCaveat")}</p>}
            {photoReason?.params?.factCheckUrl && (
              <a href={String(photoReason.params.factCheckUrl)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-ocean underline">
                {t("check.photoFactCheck")}
              </a>
            )}
            <p className="mt-2 text-xs text-navy/70">{t("check.photoDisclaimer")}</p>
          </Card>
        )}
        {previewUrl && (
          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">{t("check.photoFlags")}</legend>
            <div className="mt-1 grid gap-1">
              {PHOTO_FLAGS.map((flag) => (
                <label key={flag} className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={photoFlags.includes(flag)}
                    onChange={(event) => setPhotoFlags((current) => event.target.checked
                      ? [...current, flag]
                      : current.filter((value) => value !== flag))}
                  />
                  {t(flag)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {foundText && (
          <div className="mt-3">
            <label htmlFor="ocr-text" className="mb-1 block text-sm font-semibold">{t("check.photoFoundText")}</label>
            <textarea
              id="ocr-text"
              value={foundText}
              onChange={(event) => setFoundText(event.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-navy/15 p-3 text-base outline-none focus:border-teal"
            />
            <Button className="mt-2 w-full" onClick={() => run(foundText, source, photo, photoFlags)}>{t("check.photoCheckText")}</Button>
          </div>
        )}
        {scanProgress !== null && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-navy/70">
              <span>{t("check.photoReading")}</span><span>{scanProgress}%</span>
            </div>
            <ProgressBar pct={scanProgress} label={t("check.photoReading")} />
          </div>
        )}
        {scanError && <p role="status" className="mt-2 text-sm text-danger">{scanError}</p>}
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
        <>
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
              {result.offline.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-navy/30" aria-hidden />
                  {tk(r.code) === r.code ? r.text : tk(r.code)}
                </li>
              ))}
              {result.reasons.map((reason, i) => (
                <li key={`detail-${i}`} className="flex gap-2 text-sm">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${reason.weight > 0 ? "bg-teal" : reason.weight < 0 ? "bg-danger" : "bg-navy/30"}`} aria-hidden />
                  <span>
                    {tk(reason.key, reason.params)}
                    {reason.key === "img.knownFake" && reason.params?.factCheckUrl && (
                      <>{" "}<a href={String(reason.params.factCheckUrl)} target="_blank" rel="noopener noreferrer" className="font-medium text-ocean underline">{t("check.photoFactCheck")}</a></>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-navy/60">
              {t("check.deviceChecked")} {t("check.dataLastSaved", { when: savedAtText })}
            </p>
            <p className="mt-2 text-xs text-navy/60">
              {t("check.against", {
                alerts: result.offline.matchedAlertId ? 1 : alerts.data?.length ?? 0,
                storms: storms.data?.length ?? 0,
                place: location?.label ?? "Miami",
              })}{" "}
              {t("check.disclaimer")}
            </p>
            <p className="mt-2 text-xs font-medium text-navy/70">{t("check.photoDisclaimer")}</p>
          </div>
        </section>
        <Card className="mt-3">
          <p className="text-xs text-navy/60">{t("ai.privacyNote")}</p>
          {aiError && <p role="status" className="mt-2 text-sm text-danger">{t("ai.unavailable")}</p>}
          <Button
            type="button"
            className="mt-2 w-full"
            disabled={net === "offline" || aiLoading || aiError}
            onClick={() => void askForAiOpinion()}
          >
            <Sparkles size={17} aria-hidden />
            {t(aiLoading ? "ai.loading" : "ai.ask")}
          </Button>
          {(net === "offline" || aiError) && <p className="mt-2 text-xs text-navy/70">{t("ai.needsInternet")}</p>}
        </Card>
        {aiOpinion && (
          <Card className="mt-3" aria-live="polite">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{t("ai.title")}</h2>
              {aiDemo && <span className="rounded-full bg-warn/20 px-2 py-1 text-xs font-bold text-amber-900">{t("ai.demo")}</span>}
            </div>
            <p className="mt-2 font-semibold">{t(`ai.verdict.${aiOpinion.verdict}`)}</p>
            {aiOpinion.redFlags.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {aiOpinion.redFlags.map((flag, index) => <li key={index}>{flag}</li>)}
              </ul>
            )}
            <p className="mt-2 text-sm">{aiOpinion.explanation}</p>
          </Card>
        )}
        </>
      )}
    </div>
  );
}

function combineAiOpinion(result: VerifyResult, verdict: AiVerdict): VerifyResult {
  const aiReasons = new Set(["ai.likelyFake", "ai.noRedFlags", "ai.uncertain"]);
  const reasons = result.reasons.filter((reason) => !aiReasons.has(reason.key));
  const weight = verdict === "likely_fake" ? -25 : 0;
  const key = verdict === "likely_fake" ? "ai.likelyFake"
    : verdict === "no_red_flags" ? "ai.noRedFlags" : "ai.uncertain";
  reasons.push({ key, weight });
  const score = reasons.reduce((sum, reason) => sum + reason.weight, 0);
  const strongFlag = reasons.some((reason) => reason.weight <= -30);
  const label: VerifyResult["label"] = result.label === "suspicious" || strongFlag || score <= -30
    ? "suspicious"
    : result.label === "verified" && score >= 35 ? "verified" : "unverified";
  return { ...result, label, score, reasons: reasons.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)) };
}
