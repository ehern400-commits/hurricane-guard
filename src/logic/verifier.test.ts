import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyAlert, type VerifyContext } from "./verifier.ts";
import type { Hurricane, WeatherAlert } from "../types/index.ts";

const storm: Hurricane = {
  id: "al09", name: "Milton", classification: "HU", category: 3, windKt: 105, windMph: 120, pressureMb: 950,
  lat: 25, lon: -82, movementDir: 45, movementSpeedMph: 12, lastUpdate: new Date().toISOString(),
  advisoryUrl: null, trackUrl: null, origin: "live",
};
const alert: WeatherAlert = {
  id: "x", event: "Hurricane Warning", headline: "", description: "", severity: "Extreme", areaDesc: "Miami-Dade",
  sent: new Date().toISOString(), expires: null, senderName: "NWS Miami FL", url: null, origin: "live",
};
const live: VerifyContext = { alerts: [alert], storms: [storm], dataAgeMs: 60_000, offline: false };
const quiet: VerifyContext = { alerts: [], storms: [], dataAgeMs: 60_000, offline: false };

test("official message matching an active alert is verified", () => {
  const r = verifyAlert({ text: "NWS: Hurricane Warning in effect for Miami-Dade. Hurricane Milton. Info: weather.gov/mfl", source: "official-app" }, live);
  assert.equal(r.label, "verified");
});

test("forwarded scam with shortener and gift cards is suspicious", () => {
  const r = verifyAlert({ text: "FEMA relief: pay processing fee with gift cards at bit.ly/xyz SHARE NOW!!!", source: "forward" }, live);
  assert.equal(r.label, "suspicious");
});

test("storm name that is not active is suspicious", () => {
  const r = verifyAlert({ text: "Hurricane Zelda Category 5 hits Brickell tonight, evacuate", source: "forward" }, quiet);
  assert.equal(r.label, "suspicious");
  assert.ok(r.reasons.some((x) => x.key === "v.stormNotActive"));
});

test("category 6 claim is suspicious", () => {
  assert.equal(verifyAlert({ text: "Viene un huracán categoría 6", source: "unknown" }, quiet).label, "suspicious");
});

test("shark on highway hoax is suspicious", () => {
  assert.equal(verifyAlert({ text: "Look a shark swimming on the highway in Miami flood", source: "unknown-social" }, live).label, "suspicious");
});

test("lookalike domain is suspicious", () => {
  assert.equal(verifyAlert({ text: "Register for aid at fema-relief-help.com", source: "unknown-sms" }, quiet).label, "suspicious");
});

test("no official data loaded → unverified, never verified", () => {
  const r = verifyAlert({ text: "Hurricane Warning for Miami-Dade", source: "official-app" }, { alerts: null, storms: null, dataAgeMs: null, offline: true });
  assert.equal(r.label, "unverified");
});

test("evacuation claim with no alert for location and unknown source is not verified", () => {
  const r = verifyAlert({ text: "Evacuate Little Havana now", source: "unknown" }, quiet);
  assert.notEqual(r.label, "verified");
});
