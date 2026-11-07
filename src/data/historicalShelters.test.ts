import { test } from "node:test";
import assert from "node:assert/strict";
import { HISTORICAL_SHELTERS } from "./historicalShelters.ts";

test("historical shelter records have unique ids, locations, and source citations", () => {
  const ids = new Set(HISTORICAL_SHELTERS.map((shelter) => shelter.id));
  assert.equal(ids.size, HISTORICAL_SHELTERS.length);
  assert.ok(HISTORICAL_SHELTERS.length > 0);

  for (const shelter of HISTORICAL_SHELTERS) {
    assert.ok(Number.isFinite(shelter.lat) && shelter.lat >= -90 && shelter.lat <= 90);
    assert.ok(Number.isFinite(shelter.lon) && shelter.lon >= -180 && shelter.lon <= 180);
    assert.match(shelter.sourceUrl, /^https:\/\//);
    assert.ok(shelter.event && shelter.eventDate && shelter.sourceName);
  }
});
