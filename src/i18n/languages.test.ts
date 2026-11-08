import { test } from "node:test";
import assert from "node:assert/strict";
import { languageForLocation, languageOrder, recommendedLanguage } from "./languages.ts";

test("Miami-area locations recommend Spanish before the other supported language", () => {
  const location = { lat: 25.7743, lon: -80.1937 };
  assert.equal(recommendedLanguage(location), "es");
  assert.deepEqual(languageOrder(recommendedLanguage(location)), ["es", "en", "ht", "pt", "fr", "zh", "ar", "hi", "ko", "ja", "it"]);
});

test("Little Haiti recommends Haitian Creole first", () => {
  const location = { lat: 25.8277, lon: -80.1934 };
  assert.equal(recommendedLanguage(location), "ht");
  assert.equal(languageOrder(recommendedLanguage(location))[0], "ht");
});

test("locations outside the supported area retain the default language order", () => {
  assert.equal(recommendedLanguage({ lat: 40.7128, lon: -74.006 }), null);
  assert.deepEqual(languageOrder(null), ["en", "es", "ht", "pt", "fr", "zh", "ar", "hi", "ko", "ja", "it"]);
});

test("browser language is used outside Miami when supported", () => {
  const originalLanguage = navigator.language;
  for (const [locale, expected] of [
    ["es-MX", "es"], ["fr-CA", "fr"], ["pt-BR", "pt"], ["ht-HT", "ht"], ["zh-CN", "zh"],
    ["ar-EG", "ar"], ["hi-IN", "hi"], ["ko-KR", "ko"], ["ja-JP", "ja"], ["it-IT", "it"],
  ] as const) {
    Object.defineProperty(navigator, "language", { configurable: true, value: locale });
    assert.equal(languageForLocation({ lat: 40.7128, lon: -74.006 }), expected);
  }
  Object.defineProperty(navigator, "language", { configurable: true, value: originalLanguage });
});
