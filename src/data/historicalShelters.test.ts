import { test } from "node:test";
import assert from "node:assert/strict";
import { getRecentHistoricalShelters, HISTORICAL_SHELTERS } from "./historicalShelters.ts";

test("historical shelter records have unique ids, locations, and source citations", () => {
  const ids = new Set(HISTORICAL_SHELTERS.map((shelter) => shelter.id));
  assert.equal(ids.size, HISTORICAL_SHELTERS.length);
  assert.ok(HISTORICAL_SHELTERS.length > 0);

  for (const shelter of HISTORICAL_SHELTERS) {
    assert.ok(Number.isFinite(shelter.lat) && shelter.lat >= -90 && shelter.lat <= 90);
    assert.ok(Number.isFinite(shelter.lon) && shelter.lon >= -180 && shelter.lon <= 180);
    assert.match(shelter.sourceUrl, /^https:\/\//);
    assert.match(shelter.eventDateISO, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(shelter.event && shelter.eventDate && shelter.sourceName);
  }
});

test("historical shelter records older than 18 months are excluded", () => {
  const recent = getRecentHistoricalShelters(new Date("2026-11-07T12:00:00Z"));
  assert.deepEqual(recent, []);
});

test("historical shelter records on the 18-month cutoff remain eligible", () => {
  const cutoffRecord = (eventDateISO: string) => ({
    ...HISTORICAL_SHELTERS[0],
    eventDateISO,
  });
  const now = new Date("2026-11-07T12:00:00Z");
  assert.deepEqual(getRecentHistoricalShelters(now, [cutoffRecord("2025-05-06")]), []);
  assert.equal(getRecentHistoricalShelters(now, [cutoffRecord("2025-05-07")]).length, 1);
});
