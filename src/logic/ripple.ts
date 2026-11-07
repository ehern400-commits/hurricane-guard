// Hurricane Ripple Effect — how a storm somewhere else can reach you.
//
// Honest classification rules:
//   confirmed     → ONLY from a curated report with an official source URL
//                   (carrier/airport/port/utility statement) or demo data.
//   potential     → an official NWS tropical alert is active at a logistics hub
//                   your deliveries/food/flights commonly pass through.
//   none-reported → we checked the hub's official alerts and found none.
//                   (Shown as "No verified disruption reported" — NOT "no disruption".)
//   unavailable   → we couldn't check (offline / API error).

import type { DisruptionCategory, DisruptionClass, WeatherAlert } from "../types";

export interface Hub {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  categories: DisruptionCategory[];
  why: Record<"en" | "es", string>;
}

// Approximate coordinates of major public logistics/transport hubs.
export const HUBS: Hub[] = [
  { id: "portmiami", name: "PortMiami", region: "Miami, FL", lat: 25.7781, lon: -80.1794, categories: ["food", "packages"],
    why: { en: "Cargo and food imports for South Florida arrive here.", es: "Aquí llega carga y comida importada para el sur de Florida." } },
  { id: "mia", name: "Miami International Airport (MIA)", region: "Miami, FL", lat: 25.7959, lon: -80.287, categories: ["travel", "packages", "food"],
    why: { en: "Major passenger airport and one of the busiest US airports for international air cargo (flowers, produce).", es: "Gran aeropuerto de pasajeros y uno de los de más carga aérea internacional (flores, frutas)." } },
  { id: "evergl", name: "Port Everglades", region: "Fort Lauderdale, FL", lat: 26.092, lon: -80.121, categories: ["food", "utilities"],
    why: { en: "Receives much of South Florida's fuel (gasoline, jet fuel).", es: "Recibe gran parte del combustible del sur de Florida." } },
  { id: "jax", name: "JAXPORT", region: "Jacksonville, FL", lat: 30.4, lon: -81.56, categories: ["packages", "food"],
    why: { en: "Vehicles and containers bound for Florida stores move through here.", es: "Contenedores y vehículos para tiendas de Florida pasan por aquí." } },
  { id: "mco", name: "Orlando (MCO) / Central FL distribution", region: "Orlando, FL", lat: 28.4312, lon: -81.3081, categories: ["packages", "travel", "food"],
    why: { en: "Many retailers' Florida distribution centers are in Central Florida.", es: "Muchos centros de distribución de Florida están en el centro del estado." } },
  { id: "atl", name: "Atlanta (ATL)", region: "Atlanta, GA", lat: 33.6407, lon: -84.4277, categories: ["travel", "packages"],
    why: { en: "Busiest connecting airport; ground freight to Florida passes nearby.", es: "Aeropuerto de conexión muy usado; carga terrestre hacia Florida pasa cerca." } },
  { id: "mem", name: "Memphis air cargo hub", region: "Memphis, TN", lat: 35.0424, lon: -89.9767, categories: ["packages"],
    why: { en: "A national overnight air-package hub.", es: "Un centro nacional de paquetes aéreos nocturnos." } },
  { id: "sdf", name: "Louisville air cargo hub", region: "Louisville, KY", lat: 38.1744, lon: -85.736, categories: ["packages"],
    why: { en: "A national air-package sorting hub.", es: "Un centro nacional de clasificación de paquetes aéreos." } },
  { id: "hou", name: "Port Houston", region: "Houston, TX", lat: 29.73, lon: -95.27, categories: ["utilities", "food"],
    why: { en: "Refineries here supply fuel nationwide; Gulf storms can raise prices.", es: "Refinerías que abastecen combustible al país; tormentas en el Golfo pueden subir precios." } },
];

const TROPICAL = /hurricane|tropical storm|storm surge|extreme wind/i;

export function classifyHub(alerts: WeatherAlert[] | null | undefined, error?: boolean): DisruptionClass {
  if (error || alerts == null) return "unavailable";
  return alerts.some((a) => TROPICAL.test(a.event)) ? "potential" : "none-reported";
}

export function hubsFor(category: DisruptionCategory | "all") {
  return category === "all" ? HUBS : HUBS.filter((h) => h.categories.includes(category));
}

export const CLASS_ORDER: DisruptionClass[] = ["confirmed", "potential", "unavailable", "none-reported"];
export function sortByClass<T extends { classification: DisruptionClass }>(xs: T[]) {
  return [...xs].sort((a, b) => CLASS_ORDER.indexOf(a.classification) - CLASS_ORDER.indexOf(b.classification));
}
