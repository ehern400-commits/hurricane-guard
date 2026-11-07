import type { HistoricalShelter } from "../types";

const IRMA_MIAMI_DADE_SOURCE =
  "https://www.wlrn.org/news/2017-10-03/hurricane-irma-exposes-flaws-in-evacuations-for-medically-vulnerable-in-miami-dade";
const IRMA_REGIONAL_SOURCE =
  "https://www.wlrn.org/news/2017-09-08/do-you-know-where-the-nearest-hurricane-shelter-is-here-is-how-to-find-it";

export const HISTORICAL_SHELTERS: HistoricalShelter[] = [
  {
    id: "irma-miami-edison",
    name: "Miami Edison Senior High School",
    address: "6161 NW 5th Ct",
    city: "Miami, FL 33127",
    county: "Miami-Dade",
    lat: 25.8314951,
    lon: -80.2028495,
    event: "Hurricane Irma",
    eventDate: "September 2017",
    sourceName: "WLRN",
    sourceUrl: IRMA_MIAMI_DADE_SOURCE,
  },
  {
    id: "irma-palm-beach-gardens-high",
    name: "Palm Beach Gardens High School",
    address: "4245 Holly Dr",
    city: "Palm Beach Gardens, FL 33410",
    county: "Palm Beach",
    lat: 26.8255357,
    lon: -80.1027955,
    event: "Hurricane Irma",
    eventDate: "September 2017",
    sourceName: "WLRN",
    sourceUrl: IRMA_REGIONAL_SOURCE,
  },
  {
    id: "irma-south-florida-fairgrounds",
    name: "South Florida Fairgrounds Expo Center",
    address: "9067 Southern Blvd",
    city: "West Palm Beach, FL 33411",
    county: "Palm Beach",
    lat: 26.6846666,
    lon: -80.190756,
    event: "Hurricane Irma",
    eventDate: "September 2017",
    sourceName: "WLRN",
    sourceUrl: IRMA_REGIONAL_SOURCE,
  },
];
