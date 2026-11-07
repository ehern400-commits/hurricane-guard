// ⚠️ SIMULATED DEMONSTRATION DATA — NOT REAL.
// Used only when Demo Mode is ON. Every object has origin: "demo" and every
// name starts with "DEMO" so it can never be mistaken for a real alert.
import type { DisruptionReport, EmergencyShelter, Hurricane, WeatherAlert } from "../types";

const now = () => new Date().toISOString();

export const demoStorms = (): Hurricane[] => [
  {
    id: "demo01",
    name: "DEMO Atlas",
    classification: "HU",
    category: 3,
    windKt: 100,
    windMph: 115,
    pressureMb: 958,
    lat: 24.1,
    lon: -77.6,
    movementDir: 315,
    movementSpeedMph: 12,
    lastUpdate: now(),
    advisoryUrl: null,
    trackUrl: null,
    origin: "demo",
  },
];

export const demoAlerts = (): WeatherAlert[] => [
  {
    id: "demo-alert-1",
    event: "Hurricane Watch",
    headline: "DEMO — Hurricane Watch for Miami-Dade County (simulated)",
    description:
      "SIMULATED FOR DEMONSTRATION. Hurricane conditions are possible within 48 hours. In a real event, follow instructions from Miami-Dade Emergency Management.",
    severity: "Severe",
    areaDesc: "Miami-Dade (DEMO)",
    sent: now(),
    expires: null,
    senderName: "DEMO — not the National Weather Service",
    url: null,
    origin: "demo",
  },
];

export const demoDisruptions = (): DisruptionReport[] => [
  {
    id: "demo-d1",
    category: "packages",
    title: "DEMO: Package sorting delays at Jacksonville hub",
    summary: "Simulated: a regional sorting center pauses operations for 24h; Miami deliveries routed through it may arrive 1–3 days late.",
    region: "Jacksonville, FL",
    provider: "Example Carrier",
    classification: "confirmed",
    sourceName: "Simulated scenario",
    sourceUrl: "",
    updatedAt: now(),
    origin: "demo",
  },
  {
    id: "demo-d2",
    category: "food",
    title: "DEMO: PortMiami cargo operations suspended",
    summary: "Simulated: port closed to cargo ships before landfall; imported produce on store shelves may run low for a few days.",
    region: "Miami, FL",
    classification: "potential",
    sourceName: "Simulated scenario",
    sourceUrl: "",
    updatedAt: now(),
    origin: "demo",
  },
  {
    id: "demo-d3",
    category: "travel",
    title: "DEMO: Flight cancellations at MIA",
    summary: "Simulated: airlines cancel departures ahead of tropical-storm-force winds.",
    region: "Miami, FL",
    classification: "confirmed",
    sourceName: "Simulated scenario",
    sourceUrl: "",
    updatedAt: now(),
    origin: "demo",
  },
  {
    id: "demo-d4",
    category: "utilities",
    title: "DEMO: Scattered power outages expected",
    summary: "Simulated: utility pre-positions crews; outages possible once winds exceed 40 mph.",
    region: "Miami-Dade",
    classification: "potential",
    sourceName: "Simulated scenario",
    sourceUrl: "",
    updatedAt: now(),
    origin: "demo",
  },
];

export const demoShelters = (): EmergencyShelter[] => [
  { id: "demo-s1", name: "DEMO Shelter A (fictional)", address: "Example address — not real", city: "Miami", zip: "", lat: 25.78, lon: -80.21, petFriendly: true, type: "Demo", status: "demo", source: "Simulated" },
  { id: "demo-s2", name: "DEMO Shelter B (fictional)", address: "Example address — not real", city: "Miami", zip: "", lat: 25.75, lon: -80.25, petFriendly: false, type: "Demo", status: "demo", source: "Simulated" },
];

/** Ready-made messages to try in the Alert Checker during the demo. */
export const SAMPLE_MESSAGES = [
  { source: "forward", text: "URGENTE!!! Huracán Zelda categoría 6 llega a Brickell esta noche. COMPARTE YA antes que lo borren!!!" },
  { source: "unknown-sms", text: "FEMA relief: you qualify for $750. Pay the $25 processing fee with gift cards at bit.ly/fema-help" },
  { source: "unknown-social", text: "Look at this shark swimming on the highway in Miami after the flood" },
  { source: "official-app", text: "Miami-Dade: Hurricane Watch in effect. Review your plan. Info: miamidade.gov/emergency" },
] as const;
