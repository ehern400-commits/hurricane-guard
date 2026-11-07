import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultChecklist, progress, sortItems, validateCustomText } from "./checklist.ts";
import { classifyHub } from "./ripple.ts";
import { categoryFromKt, ktToMph, validatePhone } from "./format.ts";

test("default checklist has all 18 required items, none done", () => {
  const items = defaultChecklist();
  assert.equal(items.length, 18);
  assert.equal(progress(items).pct, 0);
});

test("progress percentage", () => {
  const items = defaultChecklist().map((i, n) => ({ ...i, done: n < 9 }));
  assert.equal(progress(items).pct, 50);
  assert.deepEqual(progress([]), { done: 0, total: 0, pct: 0 });
});

test("custom item validation", () => {
  assert.equal(validateCustomText("  "), "err.empty");
  assert.equal(validateCustomText("x".repeat(81)), "err.tooLong");
  assert.equal(validateCustomText("Baby formula"), null);
});

test("ripple: lack of data is never 'no disruption'", () => {
  assert.equal(classifyHub(null), "unavailable");
  assert.equal(classifyHub([], true), "unavailable");
  assert.equal(classifyHub([]), "none-reported");
  assert.equal(classifyHub([{ event: "Tropical Storm Warning" } as never]), "potential");
  assert.equal(classifyHub([{ event: "Heat Advisory" } as never]), "none-reported");
});

test("Saffir-Simpson category from knots", () => {
  assert.equal(categoryFromKt(63), null);
  assert.equal(categoryFromKt(64), 1);
  assert.equal(categoryFromKt(96), 3);
  assert.equal(categoryFromKt(137), 5);
  assert.equal(ktToMph(100), 115);
});

test("phone validation", () => {
  assert.equal(validatePhone("(305) 555-0100"), true);
  assert.equal(validatePhone("911"), true);
  assert.equal(validatePhone("call me"), false);
});

test("checklist keeps intended order with custom items last", () => {
  const items = defaultChecklist().filter((i) => i.category === "supplies").reverse();
  const custom = { id: "custom-a", category: "supplies" as const, text: "x", done: false, custom: true, updatedAt: 1 };
  const sorted = sortItems([custom, ...items]);
  assert.equal(sorted[0].labelKey, "cl.water");
  assert.equal(sorted.at(-1)!.id, "custom-a");
});
