// Shelters from Miami-Dade County's official Evacuation Center GIS layer.
// IMPORTANT: this layer lists *possible* evacuation centers. It does NOT tell us
// which ones are open right now — the county announces openings per storm.
// So every shelter is labeled "listed" (status not verified) unless a future
// integration with an official "open shelters" feed confirms it.

import { netFetch } from "../offline/connectivity";
import type { EmergencyShelter } from "../types";
import { loadWithCache } from "./loader";

const DIRECT =
  "https://giswspro.miamidade.gov/arcgis/rest/services/311/311CRM/MapServer/78/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";

interface Feature {
  id?: number;
  geometry: { coordinates: [number, number] } | null;
  properties: Record<string, unknown>;
}

const str = (v: unknown) => (v == null ? "" : String(v).trim());

export function parseShelters(json: { features?: Feature[] }): EmergencyShelter[] {
  return (json.features ?? [])
    .map((f, i) => {
      const p = f.properties;
      const lon = Number(p.LON ?? f.geometry?.coordinates?.[0]);
      const lat = Number(p.LAT ?? f.geometry?.coordinates?.[1]);
      return {
        id: `mdc-${str(p.OBJECTID) || i}`,
        name: str(p.ShlName) || "Evacuation Center",
        address: str(p.Address),
        city: str(p.City),
        zip: str(p.Zipcode),
        lat,
        lon,
        petFriendly: /^y/i.test(str(p.PetFrndly)),
        type: str(p.ShlType),
        status: "listed" as const,
        source: "Miami-Dade County GIS — Evacuation Centers",
      };
    })
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon) && s.lat !== 0);
}

async function fetchShelters(): Promise<EmergencyShelter[]> {
  for (const url of ["/api/shelters", DIRECT]) {
    try {
      const res = await netFetch(url, {}, 15000);
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("json")) continue;
      const list = parseShelters(await res.json());
      if (list.length) return list;
    } catch {
      /* try next */
    }
  }
  throw new Error("Shelter list unreachable");
}

export const loadShelters = () => loadWithCache("shelters", fetchShelters);

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
