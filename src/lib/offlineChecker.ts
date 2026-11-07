/**
 * On-device alert checker. This module has no network calls.
 * Red flags always win; only a fresh match with a saved official alert verifies a message.
 */
export type Label = "verified" | "suspicious" | "unverified";

export interface Reason {
  code: string;
  text: string;
}

export interface CachedOfficialAlert {
  id: string;
  event: string;
  areaDesc: string;
  sent: string;
  expires: string;
  source: string;
}

export interface CheckContext {
  officialAlerts: CachedOfficialAlert[];
  lastSyncedAt: string | null;
  now?: Date;
}

export interface CheckResult {
  label: Label;
  reasons: Reason[];
  matchedAlertId: string | null;
  links: string[];
  checkedOffline: true;
  dataAgeHours: number | null;
}

const TRUSTED_DOMAINS = [
  "weather.gov", "noaa.gov", "nhc.noaa.gov", "fema.gov", "ready.gov",
  "miamidade.gov", "miami.gov", "floridadisaster.org", "myflorida.com", "redcross.org",
];
const OFFICIAL_LOOKALIKE_WORDS = [
  "fema", "noaa", "nws", "nhc", "weather", "miamidade", "miami-dade",
  "floridadisaster", "redcross", "hurricane", "disaster", "relief", "gov",
];
const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly",
  "rebrand.ly", "shorturl.at", "tiny.cc",
];
const MONEY_OR_PERSONAL_INFO = [
  "gift card", "venmo", "zelle", "cash app", "cashapp", "paypal", "bitcoin",
  "crypto", "wire transfer", "bank account", "routing number", "account number",
  "social security", "ssn", "credit card", "debit card", "pin number",
  "processing fee", "pay a fee", "pay the fee", "verify your identity",
  "confirm your bank", "password", "date of birth",
  "tarjeta de regalo", "cuenta bancaria", "seguro social", "tarjeta de crédito",
  "tarjeta de credito", "número de cuenta", "numero de cuenta", "contraseña",
  "transferencia", "pagar una tarifa", "cuota de procesamiento",
  "kat kado", "kont labank", "sekirite sosyal", "nimewo kont", "kat kredi",
  "modpas", "peye yon frè", "peye fre",
];
const PRESSURE_WORDS = [
  "forward to everyone", "share with everyone", "send to everyone",
  "share before", "before it gets deleted", "act now", "act fast",
  "immediately or", "within 24 hours", "within 1 hour", "last chance",
  "limited time", "they don't want you to know", "media won't tell you",
  "not on the news", "urgent!!", "final warning",
  "reenvía a todos", "reenvia a todos", "compártelo", "compartelo",
  "comparte con todos", "antes de que lo borren", "actúa ya", "actua ya",
  "última oportunidad", "ultima oportunidad", "no quieren que sepas",
  "pataje ak tout moun", "voye bay tout moun", "touswit", "dènye chans",
  "denye chans", "yo pa vle ou konnen",
];
const AGENCY_CLAIMS = [
  "fema", "national weather service", "nws", "national hurricane center",
  "nhc", "miami-dade county", "miami dade county", "red cross",
  "emergency management", "noaa",
];
const OFFICIAL_EVENT_TYPES = [
  "hurricane warning", "hurricane watch", "tropical storm warning",
  "tropical storm watch", "storm surge warning", "storm surge watch",
  "flash flood warning", "flood warning", "tornado warning",
  "coastal flood statement", "extreme wind warning", "evacuation",
];
const LOCAL_AREA_WORDS = ["miami", "dade", "south florida", "florida keys", "broward"];
const STALE_AFTER_HOURS = 6;
const URL_REGEX = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?)/gi;
const IP_URL_REGEX = /\bhttps?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function extractLinks(text: string): string[] {
  const found = [...(text.match(URL_REGEX) ?? []), ...(text.match(/\bhttps?:\/\/\d{1,3}(?:\.\d{1,3}){3}(?:\/[^\s]*)?/gi) ?? [])];
  return [...new Set(found)].filter((url) => /[a-z]/i.test(url.split(".").pop() ?? ""));
}

function hostnameOf(link: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isTrustedHost(host: string): boolean {
  if (host.endsWith(".gov") || host.endsWith(".mil")) return true;
  return TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function findAny(haystack: string, needles: string[]): string | null {
  return needles.find((needle) => haystack.includes(needle)) ?? null;
}

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 36e5;
}

export function checkMessage(rawText: string, ctx: CheckContext): CheckResult {
  const now = ctx.now ?? new Date();
  const text = normalize(rawText);
  const redFlags: Reason[] = [];
  const notes: Reason[] = [];
  const dataAgeHours = ctx.lastSyncedAt
    ? hoursBetween(now, new Date(ctx.lastSyncedAt))
    : null;
  const links = extractLinks(rawText);
  let hasUntrustedLink = false;

  for (const link of links) {
    const host = hostnameOf(link);
    if (!host) continue;

    if (IP_URL_REGEX.test(link)) {
      redFlags.push({
        code: "link_ip_address",
        text: "This link goes to a bare number address instead of a real website name. Official agencies never do this.",
      });
      hasUntrustedLink = true;
    } else if (host.startsWith("xn--") || host.includes(".xn--")) {
      redFlags.push({
        code: "link_disguised_letters",
        text: `The link "${host}" uses look-alike letters to imitate a real website.`,
      });
      hasUntrustedLink = true;
    } else if (URL_SHORTENERS.includes(host)) {
      redFlags.push({
        code: "link_shortened",
        text: "This link is shortened, so you cannot see where it really goes. Official alerts use full government links.",
      });
      hasUntrustedLink = true;
    } else if (!isTrustedHost(host)) {
      const lookalike = findAny(host, OFFICIAL_LOOKALIKE_WORDS);
      redFlags.push(
        lookalike
          ? {
              code: "link_impersonation",
              text: `The link "${host}" pretends to be official but is not a government website.`,
            }
          : {
              code: "link_untrusted",
              text: `The link "${host}" is not an official emergency website.`,
            },
      );
      hasUntrustedLink = true;
    }
  }

  const moneyHit = findAny(text, MONEY_OR_PERSONAL_INFO);
  if (moneyHit) {
    redFlags.push({
      code: "asks_money_or_info",
      text: "It asks for money, payment apps or personal information. FEMA and the county never ask for these by text or social media.",
    });
  }

  const pressureHit = findAny(text, PRESSURE_WORDS);
  if (pressureHit) {
    redFlags.push({
      code: "pressure_language",
      text: "It pushes you to act or share fast. Real alerts give instructions, not pressure to forward.",
    });
  }

  const agencyHit = findAny(text, AGENCY_CLAIMS);
  if (agencyHit && hasUntrustedLink) {
    redFlags.push({
      code: "agency_mismatch",
      text: `It says it is from ${agencyHit.toUpperCase()} but sends you to a non-official website.`,
    });
  }

  if (redFlags.length > 0) {
    return {
      label: "suspicious",
      reasons: redFlags,
      matchedAlertId: null,
      links,
      checkedOffline: true,
      dataAgeHours,
    };
  }

  const claimedEvent = findAny(text, OFFICIAL_EVENT_TYPES);
  const mentionsLocalArea = findAny(text, LOCAL_AREA_WORDS);
  const dataIsStale = dataAgeHours === null || dataAgeHours > STALE_AFTER_HOURS;

  if (claimedEvent) {
    const match = ctx.officialAlerts.find((alert) => {
      const notExpired = new Date(alert.expires) > now;
      const sameEvent = alert.event.toLowerCase().includes(claimedEvent)
        || (claimedEvent === "evacuation" && alert.event.toLowerCase().includes("evacuation"));
      const sameArea = !mentionsLocalArea
        || LOCAL_AREA_WORDS.some((word) => alert.areaDesc.toLowerCase().includes(word));
      return notExpired && sameEvent && sameArea;
    });

    if (match && !dataIsStale) {
      return {
        label: "verified",
        reasons: [{
          code: "matches_official",
          text: `This matches an official ${match.event} from ${match.source} that is active now.`,
        }],
        matchedAlertId: match.id,
        links,
        checkedOffline: true,
        dataAgeHours,
      };
    }

    if (match && dataIsStale) {
      notes.push({
        code: "match_but_stale",
        text: `It matches an official ${match.event}, but your saved data is ${Math.round(dataAgeHours ?? 0)} hours old. Reconnect to confirm it is still active.`,
      });
    } else {
      notes.push({
        code: "no_official_match",
        text: `It mentions a ${claimedEvent}, but no active official alert for that was found in your saved data.`,
      });
    }
  }

  if (notes.length === 0) {
    notes.push({
      code: "no_source",
      text: "No official source has confirmed this yet. Check weather.gov or miamidade.gov before acting on it.",
    });
  }
  if (dataAgeHours === null) {
    notes.push({
      code: "never_synced",
      text: "The app has not downloaded official alerts yet, so it could only check for scam warning signs.",
    });
  }

  return {
    label: "unverified",
    reasons: notes,
    matchedAlertId: null,
    links,
    checkedOffline: true,
    dataAgeHours,
  };
}
