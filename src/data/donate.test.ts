import { test } from "node:test";
import assert from "node:assert/strict";
import { getActiveDropOffSites, type DropOffSite } from "./donate.ts";

const site = (overrides: Partial<DropOffSite> = {}): DropOffSite => ({
  name: "Relief center",
  address: "100 Main St",
  lat: 25.77,
  lon: -80.19,
  services: ["food", "supplies", "donations"],
  accepts: ["canned food"],
  sourceUrl: "https://example.org/relief-center",
  verifiedOn: "2026-11-06",
  activeFrom: "2026-11-01",
  activeThrough: "2026-11-10",
  ...overrides,
});

test("only recently verified sites inside their activation dates are listed", () => {
  const now = new Date("2026-11-07T12:00:00Z");
  const active = site();
  const future = site({ activeFrom: "2026-11-08" });
  const expired = site({ activeThrough: "2026-11-06" });
  const stale = site({ verifiedOn: "2025-05-06" });

  assert.deepEqual(getActiveDropOffSites(now, [active, future, expired, stale]), [active]);
});
