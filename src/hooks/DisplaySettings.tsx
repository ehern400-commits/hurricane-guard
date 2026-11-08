import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type TextSize = "small" | "normal" | "large";

interface DisplaySettingsValue {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

const Ctx = createContext<DisplaySettingsValue | null>(null);

function initialTextSize(): TextSize {
  try {
    const saved = localStorage.getItem("hg.textSize");
    if (saved === "small" || saved === "normal" || saved === "large") return saved;
  } catch {
    // Storage may be unavailable.
  }
  return "normal";
}

function initialDarkMode() {
  try {
    return localStorage.getItem("hg.darkMode") === "1";
  } catch {
    return false;
  }
}

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>(initialTextSize);
  const [darkMode, setDarkMode] = useState(initialDarkMode);

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try {
      localStorage.setItem("hg.textSize", textSize);
      localStorage.setItem("hg.darkMode", darkMode ? "1" : "0");
    } catch {
      // Preferences still apply for this session if storage is unavailable.
    }
  }, [textSize, darkMode]);

  const value = useMemo(
    () => ({ textSize, setTextSize, darkMode, setDarkMode }),
    [textSize, darkMode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisplaySettings() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDisplaySettings must be used inside DisplaySettingsProvider");
  return value;
}
