// Official links. Researcher: click-check every URL before the demo and update
// if a page has moved. Never add unofficial sources here.
import type { DisruptionCategory } from "../types";

export interface Resource {
  name: string;
  url: string;
  phone?: string;
}

export const EMERGENCY_NUMBERS: Resource[] = [
  { name: "Emergency — Police / Fire / EMS", url: "tel:911", phone: "911" },
  { name: "Miami-Dade 311 (non-emergency county info)", url: "tel:311", phone: "311" },
  { name: "FPL power outages", url: "tel:18004688243", phone: "1-800-468-8243" },
  { name: "Florida Poison Control", url: "tel:18002221222", phone: "1-800-222-1222" },
];

export const OFFICIAL_SOURCES: Resource[] = [
  { name: "National Hurricane Center", url: "https://www.nhc.noaa.gov/" },
  { name: "NWS Miami", url: "https://www.weather.gov/mfl/" },
  { name: "Miami-Dade Emergency Management", url: "https://www.miamidade.gov/global/emergency/home.page" },
  { name: "Florida Division of Emergency Management", url: "https://www.floridadisaster.org/" },
  { name: "Ready.gov — Hurricanes", url: "https://www.ready.gov/hurricanes" },
  { name: "FEMA", url: "https://www.fema.gov/" },
];

export const RIPPLE_SOURCES: Record<DisruptionCategory, Resource[]> = {
  packages: [
    { name: "USPS Service Alerts", url: "https://about.usps.com/newsroom/service-alerts/" },
    { name: "UPS Service Alerts", url: "https://www.ups.com/us/en/service-alerts" },
    { name: "FedEx Service Alerts", url: "https://www.fedex.com/en-us/service-alerts.html" },
  ],
  food: [
    { name: "PortMiami", url: "https://www.miamidade.gov/portmiami/" },
    { name: "Florida Division of Emergency Management", url: "https://www.floridadisaster.org/" },
  ],
  travel: [
    { name: "FAA National Airspace Status", url: "https://nasstatus.faa.gov/" },
    { name: "Miami International Airport", url: "https://www.miami-airport.com/" },
    { name: "FL511 Road Conditions", url: "https://fl511.com/" },
    { name: "Miami-Dade Transit", url: "https://www.miamidade.gov/transit/" },
  ],
  utilities: [
    { name: "FPL Storm Center & Outages", url: "https://www.fpl.com/storm.html" },
    { name: "Miami-Dade Water and Sewer", url: "https://www.miamidade.gov/water/" },
  ],
};
