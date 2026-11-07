import assert from "node:assert/strict";
import { checkMessage, type CheckContext, type Label } from "./offlineChecker";

const now = new Date("2026-11-07T20:00:00Z");
const freshContext: CheckContext = {
  officialAlerts: [{
    id: "miami-warning-1",
    event: "Hurricane Warning",
    areaDesc: "Miami-Dade County",
    sent: "2026-11-07T18:00:00Z",
    expires: "2026-11-08T20:00:00Z",
    source: "National Weather Service",
  }],
  lastSyncedAt: "2026-11-07T19:00:00Z",
  now,
};

const samples: { text: string; expected: Label; context?: CheckContext }[] = [
  {
    text: "NWS: Hurricane Warning for Miami-Dade County. Follow official instructions.",
    expected: "verified",
  },
  {
    text: "FEMA: claim your $750 relief now at fema-relief-aid.com",
    expected: "suspicious",
  },
  {
    text: "URGENT!! Forward to everyone, Metrorail closing at 6pm",
    expected: "suspicious",
  },
  {
    text: "FEMA needs your bank account number to send disaster assistance.",
    expected: "suspicious",
  },
  {
    text: "Official update: https://bit.ly/emergency",
    expected: "suspicious",
  },
  {
    text: "Emergency notice: https://192.168.1.1/update",
    expected: "suspicious",
  },
  {
    text: "National Hurricane Center update: https://xn--nhc-9za.example",
    expected: "suspicious",
  },
  {
    text: "A Tropical Storm Watch is active for Miami-Dade County.",
    expected: "unverified",
    context: {
      ...freshContext,
      lastSyncedAt: "2026-11-07T12:00:00Z",
    },
  },
  {
    text: "Metrorail is closing at 6pm tonight",
    expected: "unverified",
    context: {
      ...freshContext,
      officialAlerts: [],
      lastSyncedAt: null,
    },
  },
];

for (const [index, sample] of samples.entries()) {
  const result = checkMessage(sample.text, sample.context ?? freshContext);
  assert.equal(result.label, sample.expected, `sample ${index + 1}`);
  console.log(`${index + 1}. ${result.label}: ${sample.text}`);
}

console.log(`All ${samples.length} offline checker samples passed.`);
