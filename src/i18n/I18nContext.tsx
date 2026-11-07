import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type I18nKey } from "./en";
import { es } from "./es";
import type { Lang } from "../types";

const DICTS: Record<Lang, Record<I18nKey, string>> = { en, es };
const STORAGE_KEY = "hg.lang";

type Params = Record<string, string | number>;
interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: I18nKey, params?: Params) => string;
  /** For keys built at runtime (e.g. verifier reasons). Falls back to the key. */
  tk: (key: string, params?: Params) => string;
}

const Ctx = createContext<I18nValue | null>(null);

function fill(s: string, params?: Params) {
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : s;
}

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const d = DICTS[lang];
    return {
      lang,
      setLang,
      t: (key, params) => fill(d[key] ?? en[key] ?? key, params),
      tk: (key, params) => fill((d as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key, params),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
