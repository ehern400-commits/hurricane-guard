import assert from "node:assert/strict";
import { test } from "node:test";
import { checkMessage, type CheckContext } from "./offlineChecker";

const now = new Date("2026-11-07T20:00:00Z");
const context: CheckContext = {
  officialAlerts: [{
    id: "active-warning",
    event: "Hurricane Warning",
    areaDesc: "Miami-Dade County",
    sent: "2026-11-07T18:00:00Z",
    expires: "2026-11-08T20:00:00Z",
    source: "National Weather Service",
  }],
  lastSyncedAt: "2026-11-07T19:00:00Z",
  now,
};

test("offline checker identifies the requested suspicious and unverified messages", () => {
  assert.equal(
    checkMessage("FEMA: claim your $750 relief now at fema-relief-aid.com", context).label,
    "suspicious",
  );
  assert.equal(
    checkMessage("URGENT!! Forward to everyone, Metrorail closing at 6pm", context).label,
    "suspicious",
  );
  assert.equal(
    checkMessage("Metrorail is closing at 6pm tonight", context).label,
    "unverified",
  );
});

test("only a fresh match with an active cached official alert is verified", () => {
  const message = "Hurricane Warning for Miami-Dade County";
  const match = checkMessage(message, context);
  assert.equal(match.label, "verified");
  assert.equal(match.matchedAlertId, "active-warning");

  assert.equal(checkMessage(message, { ...context, lastSyncedAt: null }).label, "unverified");
  assert.equal(
    checkMessage(message, {
      ...context,
      officialAlerts: [{ ...context.officialAlerts[0], expires: "2026-11-07T19:00:00Z" }],
    }).label,
    "unverified",
  );
});

test("a copied active coastal flood statement matches its cached official alert", () => {
  const coastalContext: CheckContext = {
    ...context,
    officialAlerts: [{
      id: "coastal-flood",
      event: "Coastal Flood Statement",
      areaDesc: "Miami-Dade County",
      sent: "2026-11-07T18:00:00Z",
      expires: "2026-11-08T20:00:00Z",
      source: "NWS Miami FL",
    }],
  };
  const result = checkMessage(
    "Coastal Flood Statement issued November 7 until November 8 by NWS Miami FL",
    coastalContext,
  );
  assert.equal(result.label, "verified");
  assert.equal(result.matchedAlertId, "coastal-flood");
});

test("red flags take precedence over a matching official alert", () => {
  assert.equal(
    checkMessage(
      "URGENT!! Hurricane Warning for Miami-Dade County. Send your bank account now.",
      context,
    ).label,
    "suspicious",
  );
});
