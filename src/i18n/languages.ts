import { nearestNeighborhood } from "../data/neighborhoods";
import type { Lang, UserLocation } from "../types";

export const SUPPORTED_LANGUAGES: readonly Lang[] = ["en", "es", "ht", "pt", "fr", "zh"];
export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  es: "Español",
  ht: "Kreyòl Ayisyen",
  pt: "Português",
  fr: "Français",
  zh: "简体中文",
};
export const LANGUAGE_LOCALES: Record<Lang, string> = {
  en: "en-US",
  es: "es-US",
  ht: "ht",
  pt: "pt-BR",
  fr: "fr-FR",
  zh: "zh-Hans",
};

export function isSupportedLanguage(value: string | null): value is Lang {
  return value !== null && SUPPORTED_LANGUAGES.some((lang) => lang === value);
}

export function browserLanguage(): Lang {
  const code = navigator.language?.toLowerCase().split("-")[0];
  return SUPPORTED_LANGUAGES.find((lang) => lang === code) ?? "en";
}

export function recommendedLanguage(location: Pick<UserLocation, "lat" | "lon"> | null | undefined): Lang | null {
  const neighborhood = location && nearestNeighborhood(location.lat, location.lon);
  if (!neighborhood) return null;
  return neighborhood.id === "little-haiti" ? "ht" : "es";
}

export function languageForLocation(location: Pick<UserLocation, "lat" | "lon"> | null | undefined): Lang {
  return recommendedLanguage(location) ?? browserLanguage();
}

export function languageOrder(recommended: Lang | null): readonly Lang[] {
  return recommended ? [recommended, ...SUPPORTED_LANGUAGES.filter((lang) => lang !== recommended)] : SUPPORTED_LANGUAGES;
}
