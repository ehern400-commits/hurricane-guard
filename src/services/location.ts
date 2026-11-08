// Location: GPS first (works without internet on most phones), then the last
// saved location, then the user's pick from the neighborhood list or a ZIP code.
import { kv } from "../db/db";
import { netFetch } from "../offline/connectivity";
import { DEFAULT_LOCATION, nearestNeighborhood } from "../data/neighborhoods";
import type { UserLocation } from "../types";

const KEY = "location";

export async function getSavedLocation(): Promise<UserLocation> {
  return (await kv.get<UserLocation>(KEY)) ?? { ...DEFAULT_LOCATION, source: "default", at: 0 };
}

export async function saveLocation(loc: UserLocation) {
  await kv.set(KEY, loc);
  return loc;
}

export function labelFor(lat: number, lon: number) {
  const n = nearestNeighborhood(lat, lon);
  return n ? `${n.name}, Miami` : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

export function requestGps(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          label: labelFor(p.coords.latitude, p.coords.longitude),
          source: "gps",
          at: Date.now(),
          accuracyMeters: p.coords.accuracy,
        }),
      (e) => reject(new Error(e.code === 1 ? "denied" : "unavailable")),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

/** ZIP → coordinates using OpenStreetMap Nominatim (online only, light use). */
export async function geocodeZip(zip: string): Promise<UserLocation> {
  if (!/^\d{5}$/.test(zip)) throw new Error("invalid-zip");
  const res = await netFetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=us&format=json&limit=1`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hit) throw new Error("not-found");
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  return { lat, lon, label: `ZIP ${zip}`, source: "zip", at: Date.now() };
}
