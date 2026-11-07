// Core data models for Hurricane Guard.
// "origin" tells the UI where a piece of data came from so it can never confuse
// live official data, cached data, and simulated demo data.

export type DataOrigin = "live" | "cached" | "demo";
export type Lang = "en" | "es";

export interface Hurricane {
  id: string;
  name: string;
  classification: string; // NHC code: HU, TS, TD, STS, PTC...
  category: number | null; // Saffir-Simpson, only for HU
  windKt: number | null;
  windMph: number | null;
  pressureMb: number | null;
  lat: number | null;
  lon: number | null;
  movementDir: number | null; // degrees
  movementSpeedMph: number | null;
  lastUpdate: string; // ISO
  advisoryUrl: string | null;
  trackUrl: string | null;
  origin: DataOrigin;
}

export interface WeatherAlert {
  id: string;
  event: string; // e.g. "Hurricane Warning"
  headline: string;
  description: string;
  severity: string;
  areaDesc: string;
  sent: string;
  expires: string | null;
  senderName: string;
  url: string | null;
  origin: DataOrigin;
}

export interface EmergencyShelter {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  petFriendly: boolean;
  type: string;
  /** "listed" = in the official list, current open/closed status NOT verified. */
  status: "verified-open" | "listed" | "demo";
  source: string;
}

export type ChecklistCategory = "supplies" | "home" | "family";

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  /** i18n key for built-in items, or literal text for custom items */
  labelKey?: string;
  text?: string;
  done: boolean;
  custom: boolean;
  updatedAt: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notes?: string;
  updatedAt: number;
}

export type FamilyStatusKind = "safe" | "assistance" | "evacuating";
export type SyncState = "local" | "pending" | "synced" | "failed";

export interface FamilyStatus {
  id: string;
  kind: FamilyStatusKind;
  note?: string;
  createdAt: number;
  sync: SyncState;
}

export type DisruptionCategory = "packages" | "food" | "travel" | "utilities";
export type DisruptionClass =
  | "confirmed"
  | "potential"
  | "none-reported"
  | "unavailable";

export interface DisruptionReport {
  id: string;
  category: DisruptionCategory;
  title: string;
  summary: string;
  region: string;
  provider?: string;
  classification: DisruptionClass;
  sourceName: string;
  sourceUrl: string;
  updatedAt: string;
  origin: DataOrigin;
}

export interface SyncQueueItem {
  id: string;
  kind: "family-status" | "checklist" | "contact";
  payload: unknown;
  createdAt: number;
  attempts: number;
  state: SyncState;
  lastError?: string;
}

export interface SavedPlace {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lon?: number;
  createdAt: number;
}

export interface UserLocation {
  lat: number;
  lon: number;
  label: string;
  source: "gps" | "zip" | "default";
  at: number;
}

/** Result of the alert verifier (the EC-Council challenge core). */
export type VerifyLabel = "verified" | "suspicious" | "unverified";
export interface VerifyResult {
  label: VerifyLabel;
  score: number;
  reasons: { key: string; params?: Record<string, string | number>; weight: number }[];
  checkedAgainst: { alertsCount: number; stormsCount: number; dataAge: number | null; offline: boolean };
}
