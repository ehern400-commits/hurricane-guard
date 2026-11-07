// Official data sources:
//  - NHC CurrentStorms.json  → active tropical cyclones (Atlantic + E/C Pacific)
//  - NWS api.weather.gov     → active alerts for an exact lat/lon point
// Limitations (shown in README): NHC only lists storms it is advising on; NWS alerts
// are U.S. only; both can lag a few minutes; neither gives shelter status.

import { netFetch } from "../offline/connectivity";
import { categoryFromKt, ktToMph } from "../logic/format";
import type { Hurricane, WeatherAlert } from "../types";
import { loadWithCache } from "./loader";

const NHC_DIRECT = "https://www.nhc.noaa.gov/CurrentStorms.json";

// ---------- NHC ----------
interface NhcStorm {
  id: string;
  name: string;
  classification: string;
  intensity?: string | number;
  pressure?: string | number;
  latitudeNumeric?: number;
  longitudeNumeric?: number;
  movementDir?: number;
  movementSpeed?: number;
  lastUpdate?: string;
  publicAdvisory?: { url?: string } | null;
  trackCone?: { kmzFile?: string } | null;
}

export function parseNhc(json: { activeStorms?: NhcStorm[] }): Hurricane[] {
  return (json.activeStorms ?? []).map((s) => {
    const kt = s.intensity != null && s.intensity !== "" ? Number(s.intensity) : null;
    return {
      id: s.id,
      name: s.name,
      classification: s.classification,
      category: s.classification === "HU" ? categoryFromKt(kt) : null,
      windKt: kt,
      windMph: kt != null ? ktToMph(kt) : null,
      pressureMb: s.pressure != null && s.pressure !== "" ? Number(s.pressure) : null,
      lat: s.latitudeNumeric ?? null,
      lon: s.longitudeNumeric ?? null,
      movementDir: s.movementDir ?? null,
      movementSpeedMph: s.movementSpeed ?? null,
      lastUpdate: s.lastUpdate ?? new Date().toISOString(),
      advisoryUrl: s.publicAdvisory?.url ?? null,
      // Official cone/track graphics are linked from the NHC home page for each active storm.
      trackUrl: "https://www.nhc.noaa.gov/",
      origin: "live" as const,
    };
  });
}

async function fetchStorms(): Promise<Hurricane[]> {
  // 1) our serverless pass-through (works on Vercel), 2) direct (works if CORS allows)
  for (const url of ["/api/storms", NHC_DIRECT]) {
    try {
      const res = await netFetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("json")) continue; // dev server returns index.html for /api/*
      return parseNhc(await res.json());
    } catch {
      /* try next */
    }
  }
  throw new Error("NHC feed unreachable");
}

export const loadStorms = () => loadWithCache("storms", fetchStorms);

// ---------- NWS alerts by point ----------
interface NwsFeature {
  id: string;
  properties: {
    event: string;
    headline?: string;
    description?: string;
    severity?: string;
    areaDesc?: string;
    sent?: string;
    expires?: string;
    senderName?: string;
    "@id"?: string;
  };
}

export function parseNws(json: { features?: NwsFeature[] }): WeatherAlert[] {
  return (json.features ?? []).map((f) => ({
    id: f.id,
    event: f.properties.event,
    headline: f.properties.headline ?? f.properties.event,
    description: f.properties.description ?? "",
    severity: f.properties.severity ?? "Unknown",
    areaDesc: f.properties.areaDesc ?? "",
    sent: f.properties.sent ?? new Date().toISOString(),
    expires: f.properties.expires ?? null,
    senderName: f.properties.senderName ?? "National Weather Service",
    url: f.properties["@id"] ?? f.id,
    origin: "live",
  }));
}

export const pointKey = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

export async function fetchAlertsAt(lat: number, lon: number): Promise<WeatherAlert[]> {
  const res = await netFetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
    headers: { Accept: "application/geo+json" },
  });
  if (!res.ok) throw new Error(`NWS ${res.status}`);
  return parseNws(await res.json());
}

export const loadAlerts = (lat: number, lon: number) =>
  loadWithCache(`alerts:${pointKey(lat, lon)}`, () => fetchAlertsAt(lat, lon));
