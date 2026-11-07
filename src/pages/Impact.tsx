import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Plane, Package, RefreshCw, ShoppingCart, Zap } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { HUBS, classifyHub, hubsFor, sortByClass } from "../logic/ripple";
import { fetchAlertsAt } from "../services/weather";
import { cache } from "../db/db";
import { demoDisruptions } from "../data/demo";
import { RIPPLE_SOURCES } from "../data/resources";
import { distanceKm } from "../services/shelters";
import { Badge, Button, Card, ExtLink, Freshness, PageHeader, SectionTitle } from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import type { DisruptionCategory, DisruptionClass, WeatherAlert } from "../types";
import type { I18nKey } from "../i18n/en";

type Cat = DisruptionCategory | "all";
type HubResult = { alerts: WeatherAlert[] | null; error: boolean };
type HubCache = Record<string, HubResult>;

const CATS: { id: Cat; Icon: typeof Package }[] = [
  { id: "all", Icon: Package },
  { id: "packages", Icon: Package },
  { id: "food", Icon: ShoppingCart },
  { id: "travel", Icon: Plane },
  { id: "utilities", Icon: Zap },
];

const CLASS_TONE: Record<DisruptionClass, "danger" | "warn" | "gray" | "teal"> = {
  confirmed: "danger",
  potential: "warn",
  unavailable: "gray",
  "none-reported": "teal",
};

export default function Impact() {
  const { demo, net, location } = useApp();
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<Cat>("all");
  const [provider, setProvider] = useState("");
  const [hubs, setHubs] = useState<HubCache>({});
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [origin, setOrigin] = useState<"live" | "cached" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void cache.get<HubCache>("hubs").then((c) => {
      if (c) {
        setHubs(c.data);
        setCheckedAt(c.fetchedAt);
        setOrigin("cached");
      }
    });
  }, []);

  async function checkHubs() {
    setBusy(true);
    const results = await Promise.all(
      HUBS.map(async (h) => {
        try {
          return [h.id, { alerts: await fetchAlertsAt(h.lat, h.lon), error: false }] as const;
        } catch {
          return [h.id, { alerts: hubs[h.id]?.alerts ?? null, error: true }] as const;
        }
      }),
    );
    const next = Object.fromEntries(results) as HubCache;
    setHubs(next);
    if (results.some(([, r]) => !r.error)) {
      await cache.set("hubs", next);
      setCheckedAt(Date.now());
      setOrigin("live");
    }
    setBusy(false);
  }

  const hubRows = useMemo(() => {
    const here = location ?? { lat: 25.77, lon: -80.19 };
    return sortByClass(
      hubsFor(cat).map((h) => {
        const r = hubs[h.id];
        const classification = r ? classifyHub(r.alerts, r.error && !r.alerts) : "unavailable";
        const tropical = r?.alerts?.find((a) => /hurricane|tropical|surge|extreme wind/i.test(a.event));
        return { h, classification, tropical, km: distanceKm(here.lat, here.lon, h.lat, h.lon) };
      }),
    );
  }, [cat, hubs, location]);

  const demoRows = demo
    ? demoDisruptions().filter(
        (d) => (cat === "all" || d.category === cat) && (!provider || (d.provider ?? "").toLowerCase().includes(provider.toLowerCase())),
      )
    : [];

  const sources = (cat === "all" ? (Object.keys(RIPPLE_SOURCES) as DisruptionCategory[]) : [cat]).flatMap((c) => RIPPLE_SOURCES[c]);
  const filteredSources = provider ? sources.filter((s) => s.name.toLowerCase().includes(provider.toLowerCase())) : sources;

  return (
    <div>
      <PageHeader title={t("impact.title")} subtitle={t("impact.subtitle")} />
      <LocationPicker />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {CATS.map(({ id, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={cat === id}
            onClick={() => setCat(id)}
            className={`flex min-h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold ${cat === id ? "bg-teal text-white" : "bg-white text-navy ring-1 ring-navy/10"}`}
          >
            <Icon size={16} aria-hidden /> {t(`impact.cat.${id}` as I18nKey)}
          </button>
        ))}
      </div>
      <input
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        placeholder={t("impact.provider")}
        aria-label={t("impact.provider")}
        className="mb-3 min-h-11 w-full rounded-xl border border-navy/15 bg-white px-3"
      />

      {demoRows.length > 0 && (
        <div className="mb-4 space-y-2">
          {demoRows.map((d) => (
            <Card key={d.id} className="ring-2 ring-warn">
              <div className="mb-1 flex flex-wrap gap-2">
                <Badge tone="navy">{t("demo.tag")}</Badge>
                <Badge tone={CLASS_TONE[d.classification]}>{t(`impact.cls.${d.classification}` as I18nKey)}</Badge>
              </div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-sm text-navy/70">{d.summary}</p>
              <p className="mt-1 text-xs text-navy/50">{d.region} · {d.sourceName}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <SectionTitle>{t("impact.hubs")}</SectionTitle>
        <Button variant="secondary" onClick={checkHubs} disabled={busy || net === "offline"}>
          <RefreshCw size={16} className={busy ? "animate-spin" : ""} aria-hidden /> {t("impact.checkHubs")}
        </Button>
      </div>
      <ul className="space-y-2">
        {hubRows.map(({ h, classification, tropical, km }) => (
          <li key={h.id}>
            <Card className="!p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CLASS_TONE[classification]}>{t(`impact.cls.${classification}` as I18nKey)}</Badge>
                <span className="text-xs text-navy/50">{h.region} · {Math.round(km)} km</span>
              </div>
              <p className="mt-1 font-semibold">{h.name}</p>
              <p className="text-sm text-navy/70">{h.why[lang]}</p>
              <p className="mt-1 text-xs text-navy/60">
                {classification === "potential" && tropical
                  ? t("impact.hubAlert", { event: tropical.event })
                  : classification === "none-reported"
                    ? `${t("impact.hubClear")} ${t("impact.noneNote")}`
                    : t("impact.hubUnknown")}
              </p>
            </Card>
          </li>
        ))}
      </ul>
      <Freshness fetchedAt={checkedAt} origin={origin} />

      <SectionTitle>{t("impact.official")}</SectionTitle>
      <Card>
        <ul className="space-y-2 text-sm">
          {filteredSources.map((s) => <li key={s.url}><ExtLink href={s.url}>{s.name}</ExtLink></li>)}
        </ul>
      </Card>

      <SectionTitle>{t("impact.chain")}</SectionTitle>
      <Card>
        <Badge tone="gray">{t("impact.exampleTag")}</Badge>
        <ol className="mt-3 space-y-1">
          {(["impact.chain1", "impact.chain2", "impact.chain3", "impact.chain4", "impact.chain5"] as const).map((k, i, arr) => (
            <li key={k} className="flex flex-col items-center">
              <span className={`w-full rounded-xl px-3 py-2 text-center text-sm font-medium ${i === 0 ? "bg-navy text-white" : i === arr.length - 1 ? "bg-teal text-white" : "bg-ocean/10 text-navy"}`}>
                {t(k)}
              </span>
              {i < arr.length - 1 && <ArrowDown size={18} className="my-1 text-ocean" aria-hidden />}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
