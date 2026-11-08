import { test } from "node:test";
import assert from "node:assert/strict";
import { demoStorms } from "./demo.ts";

test("demo storm is fictional, labeled, and has no real advisory links", () => {
  const [storm] = demoStorms();

  assert.ok(storm);
  assert.match(storm.name, /^DEMO /);
  assert.equal(storm.origin, "demo");
  assert.equal(storm.advisoryUrl, null);
  assert.equal(storm.trackUrl, null);
});
