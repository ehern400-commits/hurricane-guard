// Alert Verifier — labels an incoming hurricane message as
//   verified   → corroborated by official data for the user's location
//   suspicious → contains red flags typical of hoaxes/scams
//   unverified → not enough evidence either way (never treated as "safe")
//
// Pure function: no network. It runs on the phone against whatever official data
// was last cached, so it keeps working when the network goes down.

import type { Hurricane, VerifyResult, WeatherAlert } from "../types";

export type SourceKind =
  | "official-app" // Miami-Dade Alerts, NWS, FEMA app, Wireless Emergency Alert
  | "official-social" // verified account of NWS/NHC/Miami-Dade
  | "news" // TV/radio/newspaper
  | "forward" // WhatsApp/Telegram forward, chain message
  | "unknown-sms"
  | "unknown-social"
  | "unknown";

export interface VerifyInput {
  text: string;
  source: SourceKind;
}

export interface VerifyContext {
  alerts: WeatherAlert[] | null; // null = never loaded for this location
  storms: Hurricane[] | null; // null = never loaded
  dataAgeMs: number | null;
  offline: boolean;
}

const OFFICIAL_DOMAINS = [
  "weather.gov", "noaa.gov", "nhc.noaa.gov", "fema.gov", "ready.gov", "miamidade.gov",
  "floridadisaster.org", "usa.gov", "redcross.org", "fpl.com", "miamigov.com",
];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rb.gy", "tiny.cc", "shorturl.at"];
const OFFICIAL_NAMES = ["noaa", "fema", "nhc", "weather", "miamidade", "miami-dade", "redcross", "nws"];

const TROPICAL_EVENTS = /hurricane|tropical storm|storm surge|extreme wind|tropical cyclone/i;

const SCAM = /\b(gift ?cards?|zelle|cash ?app|venmo|wire transfer|bitcoin|crypto|social security|ssn|password|bank account|routing number|pay (a|the)? ?fee|processing fee|tarjetas? de regalo|seguro social|contrase(ñ|n)a|cuenta bancaria|transferencia|pag(ue|ar) (una )?tarifa|cuota)\b/i;
const VIRAL = /(share|forward|send) (this|to everyone|now)|comp(a|á)rt(e|elo)|reenv(i|í)(a|alo)|p(a|á)salo|before (it'?s|they) delete/i;
const EVAC = /evacuat|evacu(a|e)|warning|watch|alerta|aviso|advertencia/i;
const HOAX = /(shark|tibur(o|ó)n).{0,40}(highway|street|freeway|road|flood|calle|autopista|carretera|inundad)/i;
const CAT6 = /(category|categor(i|í)a)\s*(6|7|8|9|six|seis|siete)/i;
// Keyword is case-insensitive-ish, but the storm name must be Capitalized.
const STORM_NAME = /(?:[Hh]urricane|HURRICANE|[Tt]ropical [Ss]torm|[Hh]urac[aá]n|HURAC[AÁ]N|[Tt]ormenta [Tt]ropical)\s+(?<name>[A-ZÁÉÍÓÚ][A-Za-záéíóúÁÉÍÓÚ]+)/g;
const NOT_NAMES = new Set(["warning", "watch", "season", "center", "category", "categoría", "categoria", "local", "statement",
  "hunter", "hunters", "preparedness", "shelter", "shelters", "alert", "evacuation", "force", "strength", "conditions", "advisory"]);
const CATEGORY = /(?:category|categor[ií]a|cat\.?)\s*(?<cat>[1-5])/i;

function domainOf(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
const isOfficial = (d: string) => OFFICIAL_DOMAINS.some((o) => d === o || d.endsWith(`.${o}`)) || d.endsWith(".gov");

export function verifyAlert(input: VerifyInput, ctx: VerifyContext): VerifyResult {
  const reasons: VerifyResult["reasons"] = [];
  const add = (key: string, weight: number, params?: Record<string, string | number>) =>
    reasons.push({ key, weight, params });
  const text = input.text.trim();
  const stale = ctx.dataAgeMs !== null && ctx.dataAgeMs > 6 * 3600_000;
  const ctxWeight = (w: number) => (stale ? Math.round(w / 2) : w);
  let corroborated = false;

  // 1. Source
  if (input.source === "official-app" || input.source === "official-social") add("v.sourceOfficial", 20);
  else if (input.source === "news") add("v.sourceNews", 5);
  else if (input.source === "forward") add("v.sourceForward", -15);
  else add("v.sourceUnknown", -5);

  // 2. Links
  const urls = text.match(/\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) ?? [];
  for (const u of urls) {
    const d = domainOf(u);
    if (!d) continue;
    if (isOfficial(d)) add("v.linkOfficial", 15, { domain: d });
    else if (SHORTENERS.includes(d)) add("v.linkShortener", -25, { domain: d });
    else if (OFFICIAL_NAMES.some((n) => d.includes(n))) add("v.linkLookalike", -40, { domain: d });
    else add("v.linkOther", -10, { domain: d });
  }

  // 3. Scam / manipulation patterns
  if (SCAM.test(text)) add("v.scam", -40);
  if (VIRAL.test(text)) add("v.viral", -15);
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  const caps = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, "").length;
  if (letters.length > 20 && caps / letters.length > 0.6) add("v.allCaps", -10);
  if (/!{3,}/.test(text)) add("v.exclaim", -5);
  if (HOAX.test(text)) add("v.hoax", -35);
  if (CAT6.test(text)) add("v.cat6", -45);

  // 4. Storm name / category against official NHC list
  const names = [...text.matchAll(STORM_NAME)]
    .map((m) => m.groups?.name ?? "")
    .filter((n) => n && !NOT_NAMES.has(n.toLowerCase()));
  if (names.length) {
    if (ctx.storms === null) add("v.noStormData", 0);
    else {
      for (const n of new Set(names.map((x) => x.toLowerCase()))) {
        const storm = ctx.storms.find((s) => s.name.toLowerCase() === n);
        if (!storm) add("v.stormNotActive", ctxWeight(-30), { name: cap(n) });
        else {
          add("v.stormActive", ctxWeight(20), { name: storm.name });
          corroborated = true;
          const c = text.match(CATEGORY);
          if (c && storm.category !== null && Number(c.groups?.cat) !== storm.category)
            add("v.categoryMismatch", -20, { claimed: c.groups?.cat ?? "", official: storm.category });
        }
      }
    }
  }

  // 5. Warnings/evacuation claims against official alerts for the user's location
  if (EVAC.test(text)) {
    if (ctx.alerts === null) add("v.noAlertData", 0);
    else {
      const tropical = ctx.alerts.filter((a) => TROPICAL_EVENTS.test(a.event));
      const mentioned = ctx.alerts.find((a) => text.toLowerCase().includes(a.event.toLowerCase()));
      if (mentioned) {
        add("v.alertMatch", ctxWeight(30), { event: mentioned.event });
        corroborated = true;
      } else if (tropical.length) {
        add("v.alertRelated", ctxWeight(15), { event: tropical[0].event });
        corroborated = true;
      } else add("v.noAlertForLocation", ctxWeight(-20));
    }
  }

  if (stale) add("v.staleData", 0, { hours: Math.round((ctx.dataAgeMs ?? 0) / 3600_000) });
  if (ctx.offline) add("v.offline", 0);

  const score = reasons.reduce((s, r) => s + r.weight, 0);
  const strongFlag = reasons.some((r) => r.weight <= -30);
  const label: VerifyResult["label"] =
    strongFlag || score <= -30 ? "suspicious" : corroborated && score >= 35 ? "verified" : "unverified";

  return {
    label,
    score,
    reasons: reasons.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    checkedAgainst: {
      alertsCount: ctx.alerts?.length ?? 0,
      stormsCount: ctx.storms?.length ?? 0,
      dataAge: ctx.dataAgeMs,
      offline: ctx.offline,
    },
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
