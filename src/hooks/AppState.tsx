// Global app state: connectivity, demo mode, location, official data.
// Data flow:  external API ──► services (loadWithCache) ──► IndexedDB cache
//                                   │                          ▲
//                                   ▼                          │ (startup read)
//                              React state  ◄──────────────────┘
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getLastOnlineAt, getNetState, isForcedOffline, setForcedOffline, startConnectivityMonitor, subscribeNet, type NetState,
} from "../offline/connectivity";
import { loadAlerts, loadStorms, pointKey } from "../services/weather";
import { loadShelters, OPEN_SHELTERS_CACHE_KEY } from "../services/shelters";
import { readCache, type Loaded } from "../services/loader";
import { getSavedLocation, saveLocation } from "../services/location";
import { demoAlerts, demoShelters, demoStorms } from "../data/demo";
import { runSync } from "../sync/syncRunner";
import { kv } from "../db/db";
import { useI18n } from "../i18n/I18nContext";
import { languageForLocation } from "../i18n/languages";
import type { EmergencyShelter, Hurricane, UserLocation, WeatherAlert } from "../types";

const empty = <T,>(): Loaded<T> => ({ data: null, fetchedAt: null, origin: null, error: null });
const DEMO_KEY = "hg.demo";

interface AppValue {
  net: NetState;
  lastOnlineAt: number | null;
  lastSyncAt: number | null;
  demo: boolean;
  setDemo: (v: boolean) => void;
  simOffline: boolean;
  setSimOffline: (v: boolean) => void;
  location: UserLocation | null;
  setLocation: (l: UserLocation) => Promise<void>;
  storms: Loaded<Hurricane[]>;
  alerts: Loaded<WeatherAlert[]>;
  shelters: Loaded<EmergencyShelter[]>;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppValue | null>(null);

function initialDemo() {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    if (v !== null) return v === "1";
  } catch {
    /* ignore */
  }
  return import.meta.env.VITE_DEMO_DEFAULT === "true";
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { recommendLang } = useI18n();
  const [net, setNet] = useState<NetState>(getNetState());
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [demo, setDemoState] = useState(initialDemo);
  const [simOffline, setSimState] = useState(isForcedOffline());
  const [location, setLoc] = useState<UserLocation | null>(null);
  const [storms, setStorms] = useState<Loaded<Hurricane[]>>(empty);
  const [alerts, setAlerts] = useState<Loaded<WeatherAlert[]>>(empty);
  const [shelters, setShelters] = useState<Loaded<EmergencyShelter[]>>(empty);
  const [refreshing, setRefreshing] = useState(false);
  const locRef = useRef<UserLocation | null>(null);

  // Startup: show cached data immediately (works offline), then refresh.
  useEffect(() => {
    void (async () => {
      const loc = await getSavedLocation();
      locRef.current = loc;
      setLoc(loc);
      recommendLang(languageForLocation(loc));
      setStorms(await readCache<Hurricane[]>("storms"));
      setAlerts(await readCache<WeatherAlert[]>(`alerts:${pointKey(loc.lat, loc.lon)}`));
      setShelters(await readCache<EmergencyShelter[]>(OPEN_SHELTERS_CACHE_KEY));
      setLastSyncAt((await kv.get<number>("lastDataSync")) ?? null);
    })();
  }, [recommendLang]);

  const inflight = useRef<Promise<void> | null>(null);
  const refresh = useCallback(() => {
    if (!inflight.current) inflight.current = doRefresh().finally(() => (inflight.current = null));
    return inflight.current;
  }, []);

  async function doRefresh() {
    const loc = locRef.current ?? (await getSavedLocation());
    setRefreshing(true);
    try {
      const [s, a, sh] = await Promise.all([loadStorms(), loadAlerts(loc.lat, loc.lon), loadShelters()]);
      setStorms(s);
      setAlerts(a);
      setShelters(sh);
      if (s.origin === "live" || a.origin === "live") {
        const now = Date.now();
        setLastSyncAt(now);
        await kv.set("lastDataSync", now);
      }
      await runSync();
    } finally {
      setRefreshing(false);
    }
  }

  // Connectivity monitor: on reconnect → refresh data + push pending sync items.
  useEffect(() => {
    const off = subscribeNet(() => {
      setNet(getNetState());
      setLastOnlineAt(getLastOnlineAt());
    });
    const stop = startConnectivityMonitor(() => void refresh());
    return () => {
      off();
      stop();
    };
  }, [refresh]);

  const setLocation = useCallback(async (l: UserLocation) => {
    await saveLocation(l);
    locRef.current = l;
    setLoc(l);
    recommendLang(languageForLocation(l));
    setAlerts(await readCache<WeatherAlert[]>(`alerts:${pointKey(l.lat, l.lon)}`));
    // Wait for any refresh using the old location, then load alerts for the new one.
    await (inflight.current ?? Promise.resolve());
    void refresh();
  }, [recommendLang, refresh]);

  const setDemo = useCallback((v: boolean) => {
    setDemoState(v);
    try {
      localStorage.setItem(DEMO_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const setSimOffline = useCallback(
    (v: boolean) => {
      setForcedOffline(v);
      setSimState(v);
      if (!v) void refresh();
    },
    [refresh],
  );

  const value = useMemo<AppValue>(() => {
    // Demo Mode swaps in clearly labeled simulated data — real data is untouched.
    const d = demo
      ? {
          storms: { data: demoStorms(), fetchedAt: Date.now(), origin: "demo" as const, error: null },
          alerts: { data: demoAlerts(), fetchedAt: Date.now(), origin: "demo" as const, error: null },
          shelters: {
            ...shelters,
            data: [...demoShelters(), ...(shelters.data ?? [])],
          },
        }
      : { storms, alerts, shelters };
    return {
      net, lastOnlineAt, lastSyncAt, demo, setDemo, simOffline, setSimOffline,
      location, setLocation, refreshing, refresh, ...d,
    };
  }, [net, lastOnlineAt, lastSyncAt, demo, setDemo, simOffline, setSimOffline, location, setLocation, refreshing, refresh, storms, alerts, shelters]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStateProvider");
  return v;
}
