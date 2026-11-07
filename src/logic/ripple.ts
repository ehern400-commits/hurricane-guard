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

import type { DisruptionCategory, DisruptionClass, Lang, WeatherAlert } from "../types";

export interface Hub {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  categories: DisruptionCategory[];
  why: Record<Lang, string>;
}

// Approximate coordinates of major public logistics/transport hubs.
export const HUBS: Hub[] = [
  { id: "portmiami", name: "PortMiami", region: "Miami, FL", lat: 25.7781, lon: -80.1794, categories: ["food", "packages"],
    why: {
      en: "Cargo and food imports for South Florida arrive here.", es: "Aquí llega carga y comida importada para el sur de Florida.",
      ht: "Se isit la machandiz ak manje ki enpòte pou sid Florid rive.", pt: "É aqui que chegam cargas e alimentos importados para o sul da Flórida.",
      fr: "C’est ici qu’arrivent les marchandises et les aliments importés pour le sud de la Floride.", zh: "运往佛罗里达州南部的货物和食品进口会从这里抵达。",
    } },
  { id: "mia", name: "Miami International Airport (MIA)", region: "Miami, FL", lat: 25.7959, lon: -80.287, categories: ["travel", "packages", "food"],
    why: {
      en: "Major passenger airport and one of the busiest US airports for international air cargo (flowers, produce).", es: "Gran aeropuerto de pasajeros y uno de los de más carga aérea internacional (flores, frutas).",
      ht: "Gwo ayewopò pasaje epi youn nan ayewopò ameriken ki pi okipe pou kago ayeryen entènasyonal (flè, fwi ak legim).",
      pt: "Grande aeroporto de passageiros e um dos mais movimentados dos EUA para carga aérea internacional (flores e produtos agrícolas).",
      fr: "Grand aéroport de passagers et l’un des plus fréquentés des États-Unis pour le fret aérien international (fleurs, produits frais).",
      zh: "大型客运机场，也是美国最繁忙的国际航空货运机场之一（运输鲜花和农产品）。",
    } },
  { id: "evergl", name: "Port Everglades", region: "Fort Lauderdale, FL", lat: 26.092, lon: -80.121, categories: ["food", "utilities"],
    why: {
      en: "Receives much of South Florida's fuel (gasoline, jet fuel).", es: "Recibe gran parte del combustible del sur de Florida.",
      ht: "Li resevwa yon gwo pati nan gaz sid Florid itilize (gazolin ak gaz pou avyon).", pt: "Recebe grande parte do combustível do sul da Flórida (gasolina e combustível de aviação).",
      fr: "Il reçoit une grande partie du carburant du sud de la Floride (essence et carburant pour avions).", zh: "这里接收佛罗里达州南部的大部分燃料（汽油和航空燃油）。",
    } },
  { id: "jax", name: "JAXPORT", region: "Jacksonville, FL", lat: 30.4, lon: -81.56, categories: ["packages", "food"],
    why: {
      en: "Vehicles and containers bound for Florida stores move through here.", es: "Contenedores y vehículos para tiendas de Florida pasan por aquí.",
      ht: "Machin ak kontenè ki prale nan magazen Florid yo pase isit la.", pt: "Veículos e contêineres destinados às lojas da Flórida passam por aqui.",
      fr: "Les véhicules et les conteneurs destinés aux magasins de Floride transitent par ici.", zh: "运往佛罗里达州商店的车辆和集装箱会经过这里。",
    } },
  { id: "mco", name: "Orlando (MCO) / Central FL distribution", region: "Orlando, FL", lat: 28.4312, lon: -81.3081, categories: ["packages", "travel", "food"],
    why: {
      en: "Many retailers' Florida distribution centers are in Central Florida.", es: "Muchos centros de distribución de Florida están en el centro del estado.",
      ht: "Anpil sant distribisyon détaillan yo nan Florid sitiye nan sant eta a.", pt: "Muitos centros de distribuição de varejistas na Flórida ficam na região central do estado.",
      fr: "De nombreux centres de distribution des détaillants en Floride se trouvent au centre de l’État.", zh: "许多零售商在佛罗里达州的配送中心位于该州中部。",
    } },
  { id: "atl", name: "Atlanta (ATL)", region: "Atlanta, GA", lat: 33.6407, lon: -84.4277, categories: ["travel", "packages"],
    why: {
      en: "Busiest connecting airport; ground freight to Florida passes nearby.", es: "Aeropuerto de conexión muy usado; carga terrestre hacia Florida pasa cerca.",
      ht: "Se ayewopò koneksyon ki pi okipe; kago ki ale Florid sou wout pase toupre.", pt: "Aeroporto de conexão mais movimentado; cargas terrestres para a Flórida passam nas proximidades.",
      fr: "Aéroport de correspondance le plus fréquenté ; le fret routier à destination de la Floride passe à proximité.", zh: "这是最繁忙的中转机场；运往佛罗里达州的陆路货运会经过附近。",
    } },
  { id: "mem", name: "Memphis air cargo hub", region: "Memphis, TN", lat: 35.0424, lon: -89.9767, categories: ["packages"],
    why: {
      en: "A national overnight air-package hub.", es: "Un centro nacional de paquetes aéreos nocturnos.",
      ht: "Yon sant nasyonal pou livrezon pakè nan lè pandan lannuit.", pt: "Um centro nacional de distribuição aérea de encomendas durante a noite.",
      fr: "Un centre national de tri aérien des colis de nuit.", zh: "全国性的夜间航空包裹枢纽。",
    } },
  { id: "sdf", name: "Louisville air cargo hub", region: "Louisville, KY", lat: 38.1744, lon: -85.736, categories: ["packages"],
    why: {
      en: "A national air-package sorting hub.", es: "Un centro nacional de clasificación de paquetes aéreos.",
      ht: "Yon sant nasyonal pou klase pakè ki transpòte nan lè.", pt: "Um centro nacional de triagem de encomendas aéreas.",
      fr: "Un centre national de tri des colis aériens.", zh: "全国性的航空包裹分拣枢纽。",
    } },
  { id: "hou", name: "Port Houston", region: "Houston, TX", lat: 29.73, lon: -95.27, categories: ["utilities", "food"],
    why: {
      en: "Refineries here supply fuel nationwide; Gulf storms can raise prices.", es: "Refinerías que abastecen combustible al país; tormentas en el Golfo pueden subir precios.",
      ht: "Rafineri isit yo founi tout peyi a gaz; tanpèt nan Gòlf la ka fè pri yo monte.", pt: "As refinarias daqui fornecem combustível para todo o país; tempestades no Golfo podem elevar os preços.",
      fr: "Les raffineries d’ici approvisionnent le pays en carburant ; les tempêtes dans le golfe peuvent faire monter les prix.", zh: "这里的炼油厂为全国供应燃料；墨西哥湾风暴可能推高价格。",
    } },
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
