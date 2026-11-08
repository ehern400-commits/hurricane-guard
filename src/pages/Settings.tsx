import { useEffect, useState } from "react";
import { Download, Moon, Presentation, Trash2, Type, WifiOff, type LucideIcon } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useDisplaySettings } from "../hooks/DisplaySettings";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { STORES, table, kv } from "../db/db";
import { seedOnce } from "../db/seed";
import { Button, Card, ExtLink, PageHeader, SectionTitle } from "../components/ui";
import { OFFICIAL_SOURCES } from "../data/resources";
import { LANGUAGE_NAMES, isSupportedLanguage, languageOrder, recommendedLanguage } from "../i18n/languages";
import { hashImageFile } from "../logic/imageCanvas";
import type { ChecklistItem, EmergencyContact, FamilyStatus, SavedPlace } from "../types";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function Toggle({
  checked, onChange, label, help, testId, icon: Icon, tone, enabledLabel, disabledLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  help: string;
  testId?: string;
  icon: LucideIcon;
  tone: "amber" | "ocean";
  enabledLabel: string;
  disabledLabel: string;
}) {
  const activeColors = tone === "amber"
    ? "border-amber-400 bg-amber-50 ring-amber-200"
    : "border-ocean/40 bg-ocean/5 ring-ocean/20";
  const iconColors = tone === "amber"
    ? "bg-amber-200 text-amber-900"
    : "bg-ocean/15 text-ocean";

  return (
    <label className={`${checked && tone === "amber" ? "demo-mode-toggle" : ""} flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border p-4 shadow-sm ring-1 transition-colors ${checked ? activeColors : "border-navy/10 bg-white ring-navy/5"}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${checked ? iconColors : "bg-navy/5 text-navy/60"}`}>
        <Icon size={24} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-navy">{label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${checked ? "bg-teal/15 text-teal-900" : "bg-navy/10 text-navy/60"}`}>
            {checked ? enabledLabel : disabledLabel}
          </span>
        </span>
        <span className="mt-1 block text-sm text-navy/70">{help}</span>
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid={testId} />
      <span className="relative h-8 w-14 shrink-0 rounded-full bg-navy/25 transition peer-checked:bg-teal peer-focus-visible:outline-3 peer-focus-visible:outline-teal after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" aria-hidden />
    </label>
  );
}

export default function Settings() {
  const { demo, setDemo, simOffline, setSimOffline, location } = useApp();
  const { t, lang, setLang } = useI18n();
  const { textSize, setTextSize, darkMode, setDarkMode } = useDisplaySettings();
  const preferredLang = recommendedLanguage(location);
  const checklist = useTable<ChecklistItem>("checklist");
  const contacts = useTable<EmergencyContact>("contacts");
  const statuses = useTable<FamilyStatus>("statuses");
  const places = useTable<SavedPlace>("places");
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  async function clearAll() {
    if (!window.confirm(t("set.clearConfirm"))) return;
    for (const s of STORES) if (s !== "kv") await table(s).clear();
    await kv.del("seeded.v1");
    await seedOnce();
  }

  async function readTeamImage(file: File | undefined) {
    if (!file) return;
    setImageHash(null);
    setHashError(null);
    setCopied(false);
    try {
      setImageHash(await hashImageFile(file));
    } catch {
      setHashError(t("set.fakeHashError"));
    }
  }

  async function copyHash() {
    if (!imageHash) return;
    try {
      await navigator.clipboard.writeText(imageHash);
      setCopied(true);
    } catch {
      setHashError(t("set.fakeCopyError"));
    }
  }

  return (
    <div>
      <PageHeader title={t("set.title")} />
      <Card>
        <label htmlFor="language-select" className="mb-2 block font-semibold">{t("set.language")}</label>
        <select
          id="language-select"
          value={lang}
          onChange={(e) => {
            if (isSupportedLanguage(e.target.value)) setLang(e.target.value);
          }}
          className="min-h-11 w-full rounded-xl border border-navy/15 bg-white px-3 font-semibold"
        >
          {languageOrder(preferredLang).map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_NAMES[l]}
            </option>
          ))}
        </select>
      </Card>

      <SectionTitle>{t("set.display")}</SectionTitle>
      <Card className="grid gap-4">
        <label className="flex items-center gap-3">
          <Type size={20} aria-hidden />
          <span className="flex-1 font-semibold">{t("set.textSize")}</span>
          <select
            value={textSize}
            onChange={(e) => {
              if (e.target.value === "small" || e.target.value === "normal" || e.target.value === "large") {
                setTextSize(e.target.value);
              }
            }}
            className="min-h-11 rounded-xl border border-navy/15 bg-white px-3 font-semibold"
          >
            <option value="small">{t("set.textSmall")}</option>
            <option value="normal">{t("set.textNormal")}</option>
            <option value="large">{t("set.textLarge")}</option>
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <Moon size={20} aria-hidden />
          <span className="flex-1">{t("set.darkMode")}</span>
          <input
            type="checkbox"
            role="switch"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="size-5 accent-teal"
          />
        </label>
      </Card>

      <SectionTitle>{t("set.testingModes")}</SectionTitle>
      <div className="grid gap-3">
        <Toggle
          checked={demo}
          onChange={setDemo}
          label={t("set.demo")}
          help={t("set.demoHelp")}
          testId="demo-toggle"
          icon={Presentation}
          tone="amber"
          enabledLabel={t("set.enabled")}
          disabledLabel={t("set.disabled")}
        />
        <Toggle
          checked={simOffline}
          onChange={setSimOffline}
          label={t("set.simOffline")}
          help={t("set.simOfflineHelp")}
          testId="offline-toggle"
          icon={WifiOff}
          tone="ocean"
          enabledLabel={t("set.enabled")}
          disabledLabel={t("set.disabled")}
        />
      </div>

      <Card className="mt-3">
        <p className="font-semibold">{t("set.install")}</p>
        <p className="mb-2 text-xs text-navy/60">{t("set.installHelp")}</p>
        {installEvt && (
          <Button onClick={() => void installEvt.prompt()}><Download size={16} aria-hidden /> {t("set.install")}</Button>
        )}
      </Card>

      <SectionTitle>{t("set.fakeToolTitle")}</SectionTitle>
      <Card>
        <p className="text-sm text-navy/70">{t("set.fakeToolHelp")}</p>
        <label className="mt-3 block text-sm font-medium" htmlFor="known-fake-image">{t("set.fakeToolPick")}</label>
        <input
          id="known-fake-image"
          className="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-ocean/10 file:px-3 file:font-semibold file:text-ocean"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            void readTeamImage(file);
          }}
        />
        {imageHash && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-navy/5 px-3 py-2 font-mono text-sm">{imageHash}</code>
            <Button type="button" variant="secondary" onClick={() => void copyHash()}>{t(copied ? "set.fakeCopied" : "set.fakeCopy")}</Button>
          </div>
        )}
        {hashError && <p role="status" className="mt-2 text-sm text-danger">{hashError}</p>}
      </Card>

      <SectionTitle>{t("set.storage")}</SectionTitle>
      <Card>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          <li>{t("safety.checklist")}: <strong>{checklist?.length ?? 0}</strong></li>
          <li>{t("safety.contacts")}: <strong>{contacts?.length ?? 0}</strong></li>
          <li>{t("fam.history")}: <strong>{statuses?.length ?? 0}</strong></li>
          <li>{t("map.saved")}: <strong>{places?.length ?? 0}</strong></li>
        </ul>
        <Button variant="danger" className="mt-3" onClick={clearAll}><Trash2 size={16} aria-hidden /> {t("set.clear")}</Button>
      </Card>

      <SectionTitle>{t("set.about")}</SectionTitle>
      <Card>
        <p className="text-sm font-semibold">{t("app.name")} — {t("app.tagline")}</p>
        <p className="mt-1 text-xs text-navy/60">{t("home.disclaimer")}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {OFFICIAL_SOURCES.map((s) => <li key={s.url}><ExtLink href={s.url}>{s.name}</ExtLink></li>)}
        </ul>
      </Card>
    </div>
  );
}
