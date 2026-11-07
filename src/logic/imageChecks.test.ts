import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanOcrText, containsAiWatermark, differenceHash, hammingDistance64, inspectImageLabels } from "./imageChecks.ts";

test("dHash Hamming distance counts differing bits", () => {
  assert.equal(hammingDistance64("0000000000000000", "000000000000000f"), 4);
});

test("AI source label is detected in file bytes", () => {
  const bytes = new TextEncoder().encode("metadata: trainedAlgorithmicMedia");
  assert.equal(inspectImageLabels(bytes).aiLabel, "trainedAlgorithmicMedia");
});

test("AI watermark text is detected without regard to case", () => {
  assert.equal(containsAiWatermark("This image was AI-generated"), true);
});

test("OCR text cleaning removes short and symbol-heavy lines", () => {
  assert.equal(cleanOcrText("OK\n!!!! @@@\nHurricane warning\nStorm surge!!!"), "Hurricane warning\nStorm surge!!!");
});

test("dHash returns a 64-bit value from a 9x8 grayscale image", () => {
  const pixels = new Uint8ClampedArray(9 * 8 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels[i] = i % (9 * 4) === 0 ? 255 : 0;
  assert.match(differenceHash(pixels), /^[\da-f]{16}$/);
});
