import { lazy, Suspense, useMemo, useState } from "react";
import { MapPin, Navigation, PawPrint, Plus, Search, Star, Trash2 } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { useTable } from "../hooks/useTable";
import { table, uid } from "../db/db";
import { distanceKm, OPEN_SHELTERS_SOURCE } from "../services/shelters";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Badge, Button, Card, ExtLink, Freshness, Input, PageHeader, SectionTitle } from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import { getRecentHistoricalShelters } from "../data/historicalShelters";
import { getActiveDropOffSites } from "../data/donate";
import type { EmergencyShelter, SavedPlace } from "../types";

const MapView = lazy(() => import("../components/MapView"));
const places = table<SavedPlace>("places");

function directionsUrl(s: { lat?: number; lon?: number; address?: string }) {
  const q = s.lat != null && s.lon != null ? `${s.lat},${s.lon}` : encodeURIComponent(s.address ?? "");
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

export default function MapPage() {
  const { shelters, storms, alerts, location, net } = useApp();
  const { t } = useI18n();
  const saved = useTable<SavedPlace>("places");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  const center = location ?? { lat: 25.7743, lon: -80.1937 };
  const supportSites = getActiveDropOffSites();
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (shelters.data ?? [])
      .filter((s) => !term || `${s.name} ${s.city} ${s.zip} ${s.address}`.toLowerCase().includes(term))
      .map((s) => ({ s, km: distanceKm(center.lat, center.lon, s.lat, s.lon) }))
      .sort((a, b) => a.km - b.km);
  }, [shelters.data, q, center.lat, center.lon]);
  const historicalList = useMemo(() => {
    const term = q.trim().toLowerCase();
    return getRecentHistoricalShelters()
      .filter((s) => !term || `${s.name} ${s.city} ${s.county} ${s.address} ${s.event}`.toLowerCase().includes(term))
      .map((s) => ({ s, km: distanceKm(center.lat, center.lon, s.lat, s.lon) }))
      .sort((a, b) => a.km - b.km);
  }, [q, center.lat, center.lon]);
  const nearbyStorms = useMemo(
    () => (storms.data ?? [])
      .filter((storm) => storm.lat != null && storm.lon != null && Number.isFinite(storm.lat) && Number.isFinite(storm.lon))
      .map((storm) => ({ storm, km: distanceKm(center.lat, center.lon, storm.lat!, storm.lon!) }))
      .sort((a, b) => a.km - b.km),
    [storms.data, center.lat, center.lon],
  );

  async function savePlace(p: Omit<SavedPlace, "id" | "createdAt">) {
    await places.put({ ...p, id: uid("place"), createdAt: Date.now() });
  }

  async function submitPlace() {
    if (!label.trim() || !address.trim()) return setFormErr(t("err.empty"));
    await savePlace({ label: label.trim().slice(0, 60), address: address.trim().slice(0, 120) });
    setLabel("");
    setAddress("");
    setAdding(false);
    setFormErr(null);
  }

  const statusBadge = (s: EmergencyShelter) =>
    s.status === "demo" ? <Badge tone="navy">{t("map.demo")}</Badge>
    : s.status === "verified-open" && shelters.origin === "live" ? <Badge tone="teal">{t("map.verifiedOpen")}</Badge>
    : <Badge tone="warn">{t("map.listed")}</Badge>;

  const mapFallback = <p className="rounded-2xl bg-white p-4 text-sm text-navy/70">{t("map.mapOffline")}</p>;

  return (
    <div>
      <PageHeader title={t("map.title")} />
      <LocationPicker />

      <ErrorBoundary fallback={mapFallback}>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-navy/10" />}>
          <MapView
            center={center}
            centerLabel={t("map.yourLocation")}
            shelters={list.slice(0, 200).map(({ s }) => ({
              ...s,
              status: s.status === "verified-open" && shelters.origin !== "live" ? "listed" : s.status,
            }))}
            storms={storms.data ?? []}
            stormLabel={t("map.stormMarker")}
            supportSites={supportSites}
            supportLabel={t("map.disasterSupportBadge")}
            supportServiceLabels={{
              food: t("map.support.food"),
              supplies: t("map.support.supplies"),
              donations: t("map.support.donations"),
            }}
            sourceLabel={t("common.source")}
            historicalShelters={historicalList.map((x) => x.s)}
            historicalLabel={t("map.historicalBadge")}
            historicalDisclaimer={t("map.historicalDisclaimer")}
            offlineMode={net !== "online"}
            offlineLabel={t("map.mapOffline")}
          />
        </Suspense>
      </ErrorBoundary>

      <SectionTitle>{t("map.impactTitle")}</SectionTitle>
      <Card>
        <p className="text-sm text-navy/70">{t("map.impactIntro")}</p>
        <div className="mt-3 rounded-xl bg-ocean/5 p-3 text-sm">
          <p className="font-semibold">{location?.source === "gps" ? t("map.yourLocation") : location?.label ?? t("loc.default")}</p>
          <p className="mt-1 text-navy/70">
            {t("map.coordinates", { lat: center.lat.toFixed(5), lon: center.lon.toFixed(5) })}
          </p>
          {location?.source === "gps" && location.accuracyMeters != null && Number.isFinite(location.accuracyMeters) && (
            <p className="text-navy/70">{t("map.gpsAccuracy", { meters: Math.round(location.accuracyMeters) })}</p>
          )}
        </div>

        <h3 className="mt-4 font-semibold">{t("map.activeAlerts")}</h3>
        {alerts.data === null ? (
          <p className="mt-1 text-sm text-navy/70">
            {alerts.error || net === "offline" ? t("map.alertsUnavailableOffline") : t("common.loading")}
          </p>
        ) : alerts.data.length === 0 ? (
          <p className="mt-1 text-sm text-navy/70">{t("map.noActiveAlerts")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alerts.data.map((alert) => (
              <li key={alert.id} className="rounded-xl border border-navy/10 p-3">
                <p className="font-semibold">{alert.headline}</p>
                <p className="text-sm text-navy/70">{alert.event} · {alert.severity}</p>
                {alert.url && <ExtLink href={alert.url}>{t("common.officialLink")}</ExtLink>}
              </li>
            ))}
          </ul>
        )}
        {alerts.data !== null && <Freshness fetchedAt={alerts.fetchedAt} origin={alerts.origin} />}

        <h3 className="mt-4 font-semibold">{t("map.stormCenters")}</h3>
        {nearbyStorms.length === 0 ? (
          <p className="mt-1 text-sm text-navy/70">{t("map.noActiveStorms")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {nearbyStorms.slice(0, 5).map(({ storm, km }) => (
              <li key={storm.id} className="flex items-center justify-between gap-3 rounded-xl border border-navy/10 p-3">
                <span className="font-semibold">{storm.name}</span>
                <span className="text-right text-sm text-navy/70">{t("map.stormDistance", { km: km.toFixed(0) })}</span>
              </li>
            ))}
          </ul>
        )}
        {storms.data !== null && <Freshness fetchedAt={storms.fetchedAt} origin={storms.origin} />}
        <p className="mt-3 text-xs text-navy/60">{t("map.impactCaveat")}</p>
        <p className="mt-2 text-sm"><ExtLink href="https://www.nhc.noaa.gov/">{t("map.nhcAdvisories")}</ExtLink></p>
      </Card>

      <p className="mt-3 rounded-xl bg-warn/15 p-3 text-sm text-amber-900">{t("map.statusNote")}</p>

      <SectionTitle>{t("map.statewideTitle")}</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-navy/70">{t("map.statewideDescription")}</p>
        <ul className="space-y-2 text-sm">
          <li><ExtLink href="https://floridadisaster.maps.arcgis.com/apps/webappviewer/index.html?id=c1ba92018f8c489e9c5996188ee05b95">{t("map.statewideShelterMap")}</ExtLink></li>
          <li><ExtLink href="https://www.floridadisaster.org/planprepare/counties/">{t("map.countyEmergencyOffices")}</ExtLink></li>
          <li><ExtLink href="https://www.floridadisaster.org/disaster-updates/">{t("map.stateDisasterUpdates")}</ExtLink></li>
          <li><ExtLink href="https://fl211.org/">{t("map.stateFoodHelp")}</ExtLink></li>
          <li><ExtLink href="https://www.nhc.noaa.gov/gis/">{t("map.nhcGis")}</ExtLink></li>
          <li><ExtLink href="https://experience.arcgis.com/experience/394dd27d22fb4089aa5ae782d97280a2">{t("map.flipper")}</ExtLink></li>
          <li><ExtLink href="https://coast.noaa.gov/hurricanes/#map=4/32/-80">{t("map.hurricaneTracks")}</ExtLink></li>
        </ul>
      </Card>

      <SectionTitle>{t("map.disasterSupportTitle")}</SectionTitle>
      {supportSites.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/70">{t("map.noActiveSupportSites")}</p>
          <p className="mt-2 text-sm">
            <ExtLink href="https://www.miamidade.gov/global/emergency/home.page">{t("donate.officialChannels")}</ExtLink>
          </p>
        </Card>
      ) : (
        <ul className="mb-4 space-y-2">
          {supportSites.map((site) => (
            <li key={`${site.name}-${site.address}`}>
              <Card className="!p-3">
                <p className="font-semibold">{site.name}</p>
                <p className="text-sm text-navy/70">{[site.address, site.city].filter(Boolean).join(", ")}</p>
                <p className="mt-1 text-xs text-navy/60">{t("map.disasterSupportServices", { services: site.services.map((service) => t(`map.support.${service}`)).join(", ") })}</p>
                {site.accepts.length > 0 && <p className="text-xs text-navy/60">{t("donate.accepts")}: {site.accepts.join(", ")}</p>}
                <p className="text-xs text-navy/50">{t("donate.verifiedOn")}: {site.verifiedOn} · {site.activeFrom}–{site.activeThrough}</p>
                <div className="mt-2 flex gap-2">
                  <a href={directionsUrl(site)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-ocean/10 px-3 text-sm font-semibold text-ocean">
                    <Navigation size={14} aria-hidden /> {t("common.directions")}
                  </a>
                  <ExtLink href={site.sourceUrl}>{t("common.source")}</ExtLink>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>{t("map.historicalTitle")}</SectionTitle>
      <p className="mb-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-950">{t("map.historicalDisclaimer")}</p>
      {historicalList.length === 0 && <p className="mb-3 text-sm text-navy/60">{t("map.historicalNoneRecent")}</p>}
      <ul className="mb-4 space-y-2">
        {historicalList.map(({ s, km }) => (
          <li key={s.id}>
            <Card className="!p-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-violet-700" aria-hidden />
                <div className="flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-navy/70">{[s.address, s.city].filter(Boolean).join(", ")}</p>
                  <p className="mt-1 text-xs text-navy/60">{t("map.historicalEvent", { event: s.event, date: s.eventDate })} · {s.county}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="navy">{t("map.historicalBadge")}</Badge>
                    <span className="text-xs text-navy/50">{t("map.km", { km: km.toFixed(1) })}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-ocean/10 px-3 text-sm font-semibold text-ocean">
                  <Navigation size={14} aria-hidden /> {t("common.directions")}
                </a>
                <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ocean hover:bg-ocean/10">
                  {t("common.source")}: {s.sourceName}
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <SectionTitle>{t("map.saved")}</SectionTitle>
      <div className="space-y-2">
        {(saved ?? []).map((p) => (
          <Card key={p.id} className="flex items-center gap-3 !p-3">
            <Star size={18} className="text-warn" aria-hidden />
            <div className="flex-1">
              <p className="font-semibold">{p.label}</p>
              <p className="text-xs text-navy/60">{p.address}</p>
            </div>
            <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-xl text-ocean hover:bg-ocean/10" aria-label={t("common.directions")}>
              <Navigation size={18} aria-hidden />
            </a>
            <button onClick={() => places.delete(p.id)} className="grid size-11 place-items-center rounded-xl text-danger hover:bg-danger/10" aria-label={t("common.delete")}>
              <Trash2 size={18} aria-hidden />
            </button>
          </Card>
        ))}
        {adding ? (
          <Card className="space-y-2">
            <Input label={t("map.placeLabel")} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
            <Input label={t("map.placeAddress")} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={120} />
            {formErr && <p className="text-sm text-danger">{formErr}</p>}
            <div className="flex gap-2">
              <Button onClick={submitPlace}>{t("common.save")}</Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>{t("common.cancel")}</Button>
            </div>
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> {t("map.savePlace")}</Button>
        )}
      </div>

      <SectionTitle>{t("map.list")}</SectionTitle>
      <p className="mb-2 text-xs text-navy/60">{t("map.localShelterScope")}</p>
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-3 text-navy/40" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("map.searchPh")}
          aria-label={t("map.searchPh")}
          className="min-h-11 w-full rounded-xl border border-navy/15 bg-white pl-10 pr-3"
        />
      </div>
      {shelters.data === null && <Card><p className="text-sm">{net === "offline" ? t("net.never") : shelters.error ? t("common.unavailable") : t("common.loading")}</p></Card>}
      {shelters.error && <p className="mb-2 text-sm text-amber-800">{t("map.feedUnavailable")}</p>}
      {shelters.data !== null && list.length === 0 && <p className="text-sm text-navy/60">{t("map.none")}</p>}
      <ul className="space-y-2">
        {list.slice(0, 50).map(({ s, km }) => (
          <li key={s.id}>
            <Card className="!p-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-ocean" aria-hidden />
                <div className="flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-navy/70">{[s.address, s.city, s.zip].filter(Boolean).join(", ")}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {statusBadge(s)}
                    {s.petFriendly && <Badge tone="ocean"><PawPrint size={12} aria-hidden />{t("map.pet")}</Badge>}
                    <span className="text-xs text-navy/50">{t("map.km", { km: km.toFixed(1) })}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <a href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-ocean/10 px-3 text-sm font-semibold text-ocean">
                  <Navigation size={14} aria-hidden /> {t("common.directions")}
                </a>
                <button
                  onClick={() => savePlace({ label: s.name, address: [s.address, s.city].filter(Boolean).join(", "), lat: s.lat, lon: s.lon })}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ocean hover:bg-ocean/10"
                >
                  <Star size={14} aria-hidden /> {t("map.saveThis")}
                </button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <Freshness fetchedAt={shelters.fetchedAt} origin={shelters.origin} />
      <p className="mt-2 text-xs text-navy/50">
        {t("map.source")} · <ExtLink href={OPEN_SHELTERS_SOURCE}>{t("common.officialLink")}</ExtLink>
      </p>
    </div>
  );
}
