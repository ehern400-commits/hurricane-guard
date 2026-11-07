// Trolley-style neighborhood picker (used when GPS is denied/unavailable).
// Coordinates are APPROXIMATE neighborhood centers — good enough to look up
// official NWS alerts for that area, not for navigation.
export interface Neighborhood {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "allapattah", name: "Allapattah", lat: 25.8146, lon: -80.2241 },
  { id: "brickell", name: "Brickell", lat: 25.7617, lon: -80.1918 },
  { id: "coconut-grove", name: "Coconut Grove", lat: 25.728, lon: -80.243 },
  { id: "coral-way", name: "Coral Way", lat: 25.75, lon: -80.285 },
  { id: "downtown", name: "Downtown Miami", lat: 25.7743, lon: -80.1937 },
  { id: "doral", name: "Doral", lat: 25.8195, lon: -80.3553 },
  { id: "flagami", name: "Flagami", lat: 25.762, lon: -80.316 },
  { id: "hialeah", name: "Hialeah", lat: 25.8576, lon: -80.2781 },
  { id: "homestead", name: "Homestead", lat: 25.4687, lon: -80.4776 },
  { id: "kendall", name: "Kendall", lat: 25.6793, lon: -80.3173 },
  { id: "liberty-city", name: "Liberty City", lat: 25.834, lon: -80.224 },
  { id: "little-haiti", name: "Little Haiti", lat: 25.8277, lon: -80.1934 },
  { id: "little-havana", name: "Little Havana", lat: 25.7656, lon: -80.2207 },
  { id: "miami-beach", name: "Miami Beach", lat: 25.7907, lon: -80.13 },
  { id: "overtown", name: "Overtown", lat: 25.7867, lon: -80.201 },
  { id: "wynwood", name: "Wynwood", lat: 25.801, lon: -80.199 },
];

export const DEFAULT_LOCATION = { lat: 25.7743, lon: -80.1937, label: "Miami, FL" };

/** Nearest listed neighborhood (offline, no geocoding service needed). */
export function nearestNeighborhood(lat: number, lon: number) {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const n of NEIGHBORHOODS) {
    const d = (n.lat - lat) ** 2 + (n.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  // ~0.05° ≈ 5 km; beyond that we don't claim a Miami neighborhood
  return Math.sqrt(bestD) < 0.05 ? best : null;
}
