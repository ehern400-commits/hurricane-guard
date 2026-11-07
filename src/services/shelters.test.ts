import { test } from "node:test";
import assert from "node:assert/strict";
import { isShelterFeedFresh, parseShelters, SHELTER_FEED_MAX_AGE_MS } from "./shelters.ts";

const feature = (shelterStatus: string, objectId: number) => ({
  id: objectId,
  geometry: { coordinates: [-80.19, 25.77] as [number, number] },
  properties: {
    ObjectID: objectId,
    shelter_name: `Center ${objectId}`,
    address: "100 Main St",
    city: "Miami",
    zip: "33101",
    petfriendly: "Yes",
    shelter_type: "General",
    shelter_status: shelterStatus,
  },
});

test("the open shelter parser only includes open centers and maps county fields", () => {
  const shelters = parseShelters({
    features: [
      feature("Open", 1),
      feature("Open - Pet Friendly", 2),
      feature("Full", 3),
      feature("Closed", 4),
      { ...feature("Open", 5), geometry: null },
    ],
  });

  assert.equal(shelters.length, 2);
  assert.equal(shelters[0].status, "verified-open");
  assert.equal(shelters[0].petFriendly, true);
  assert.equal(shelters[1].id, "mdc-open-2");
});

test("shelter feed must be edited within its weekly update window", () => {
  const now = 1_800_000_000_000;
  assert.equal(isShelterFeedFresh(now - SHELTER_FEED_MAX_AGE_MS, now), true);
  assert.equal(isShelterFeedFresh(now - SHELTER_FEED_MAX_AGE_MS - 1, now), false);
  assert.equal(isShelterFeedFresh(undefined, now), false);
  assert.equal(isShelterFeedFresh(now + 1, now), false);
});
