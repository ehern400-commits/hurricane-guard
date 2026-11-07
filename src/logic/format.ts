// Saffir-Simpson Hurricane Wind Scale (1-min sustained winds, knots).
export function categoryFromKt(kt: number | null): number | null {
  if (kt == null || kt < 64) return null;
  if (kt >= 137) return 5;
  if (kt >= 113) return 4;
  if (kt >= 96) return 3;
  if (kt >= 83) return 2;
  return 1;
}

export const ktToMph = (kt: number) => Math.round(kt * 1.15078 / 5) * 5; // NHC rounds mph to 5

export function validatePhone(p: string) {
  const digits = p.replace(/[\s().+-]/g, "");
  return /^\d{3,15}$/.test(digits);
}

export function compass(deg: number | null) {
  if (deg == null) return "—";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function timeAgo(ts: number | string | null | undefined, lang: "en" | "es") {
  if (ts == null) return lang === "es" ? "nunca" : "never";
  const ms = Date.now() - (typeof ts === "string" ? Date.parse(ts) : ts);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const m = Math.round(ms / 60000);
  if (Math.abs(m) < 60) return rtf.format(-m, "minute");
  const h = Math.round(m / 60);
  if (Math.abs(h) < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.round(h / 24), "day");
}

export function fmtDateTime(ts: number | string, lang: "en" | "es") {
  return new Date(ts).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });
}
