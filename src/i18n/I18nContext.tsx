import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type I18nKey } from "./en";
import { es } from "./es";
import { browserLanguage, isSupportedLanguage } from "./languages";
import { ht } from "./ht";
import { pt } from "./pt";
import { fr } from "./fr";
import { zh } from "./zh";
import type { Lang } from "../types";

const DICTS: Record<Lang, Record<I18nKey, string>> = { en, es, ht, pt, fr, zh };
const STORAGE_KEY = "hg.lang";

type Params = Record<string, string | number>;
interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  recommendLang: (l: Lang) => void;
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
    if (isSupportedLanguage(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return browserLanguage();
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
  const recommendLang = useCallback((l: Lang) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isSupportedLanguage(saved)) return;
    } catch {
      /* storage unavailable */
    }
    setLangState(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang === "pt" ? "pt-BR" : lang;
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const d = DICTS[lang];
    return {
      lang,
      setLang,
      recommendLang,
      t: (key, params) => fill(d[key] ?? en[key] ?? key, params),
      tk: (key, params) => fill((d as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key, params),
    };
  }, [lang, setLang, recommendLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
