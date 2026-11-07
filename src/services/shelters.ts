// Current open evacuation centers from Miami-Dade County's authoritative feed.
// The feed advertises weekly updates, so older service data is not presented as current.
import { netFetch } from "../offline/connectivity";
import type { EmergencyShelter } from "../types";
import { loadWithCache } from "./loader";

const SERVICE =
  "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/EvacuationCenterShelters_Open/FeatureServer/0";
export const OPEN_SHELTERS_SOURCE =
  "https://opendata.miamidade.gov/datasets/MDC::evacuation-center-shelters-open/explore";
export const OPEN_SHELTERS_CACHE_KEY = "open-shelters";
export const SHELTER_FEED_MAX_AGE_MS = 8 * 24 * 60 * 60 * 1000;

interface Feature {
  id?: number | string;
  geometry: { coordinates: [number, number] } | null;
  properties: Record<string, unknown>;
}

interface LayerMetadata {
  editingInfo?: { lastEditDate?: number };
}

const str = (v: unknown) => (v == null ? "" : String(v).trim());
const isYes = (v: unknown) => /^(y|yes|true|1)$/i.test(str(v));

export function isShelterFeedFresh(lastEditDate: number | undefined, now = Date.now()): boolean {
  return typeof lastEditDate === "number" &&
    Number.isFinite(lastEditDate) &&
    lastEditDate <= now &&
    now - lastEditDate <= SHELTER_FEED_MAX_AGE_MS;
}

export function parseShelters(json: { features?: Feature[] }): EmergencyShelter[] {
  return (json.features ?? [])
    .filter((feature) => {
      const status = str(feature.properties.shelter_status);
      return /\bopen\b/i.test(status) && !/\b(full|closed)\b/i.test(status);
    })
    .map((feature, index) => {
      const properties = feature.properties;
      const [lon, lat] = feature.geometry?.coordinates ?? [NaN, NaN];
      const id = str(properties.ObjectID ?? feature.id) || String(index);
      return {
        id: `mdc-open-${id}`,
        name: str(properties.shelter_name) || "Evacuation Center",
        address: str(properties.address),
        city: str(properties.city),
        zip: str(properties.zip),
        lat: Number(lat),
        lon: Number(lon),
        petFriendly: isYes(properties.petfriendly),
        type: str(properties.shelter_type),
        status: "verified-open" as const,
        source: "Miami-Dade County Open Evacuation Centers",
      };
    })
    .filter((s) =>
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lon) &&
      s.lat !== 0,
    );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await netFetch(url, {}, 15000);
  if (!response.ok) throw new Error(`County shelter service returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchShelters(): Promise<EmergencyShelter[]> {
  const [metadata, response] = await Promise.all([
    fetchJson<LayerMetadata>(`${SERVICE}?f=json`),
    fetchJson<{ features?: Feature[] }>(
      `${SERVICE}/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`,
    ),
  ]);
  if (!isShelterFeedFresh(metadata.editingInfo?.lastEditDate)) {
    throw new Error("County open-shelter feed is older than its weekly update window");
  }
  if (!Array.isArray(response.features)) {
    throw new Error("County shelter service returned an invalid feature list");
  }
  return parseShelters(response);
}

export const loadShelters = () => loadWithCache(OPEN_SHELTERS_CACHE_KEY, fetchShelters);

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
