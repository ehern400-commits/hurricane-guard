// OpenStreetMap tiles are online-only. Offline, Leaflet remains interactive and
// shows the user's saved location and cached site markers on a simple backdrop.
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EmergencyShelter, HistoricalShelter, Hurricane } from "../types";
import type { DropOffSite } from "../data/donate";

interface Props {
  center: { lat: number; lon: number };
  centerLabel: string;
  shelters: EmergencyShelter[];
  storms: Hurricane[];
  stormLabel: string;
  supportSites: DropOffSite[];
  supportLabel: string;
  supportServiceLabels: Record<DropOffSite["services"][number], string>;
  sourceLabel: string;
  historicalShelters: HistoricalShelter[];
  historicalLabel: string;
  historicalDisclaimer: string;
  offlineMode: boolean;
  offlineLabel: string;
  onSelect?: (s: EmergencyShelter) => void;
}

export default function MapView({ center, centerLabel, shelters, storms, stormLabel, supportSites, supportLabel, supportServiceLabels, sourceLabel, historicalShelters, historicalLabel, historicalDisclaimer, offlineMode, offlineLabel, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([center.lat, center.lon], 12);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
      tiles.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;
    if (offlineMode) {
      if (tiles.current) currentMap.removeLayer(tiles.current);
      tiles.current = null;
    } else if (!tiles.current) {
      tiles.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(currentMap);
    }
  }, [offlineMode]);

  useEffect(() => {
    map.current?.setView([center.lat, center.lon], map.current.getZoom());
  }, [center.lat, center.lon]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    L.circleMarker([center.lat, center.lon], { radius: 9, color: "#10283E", weight: 3, fillColor: "#20B7AD", fillOpacity: 1 })
      .bindTooltip(escapeHtml(centerLabel), { permanent: offlineMode })
      .addTo(g);
    storms.forEach((storm) => {
      if (storm.lat == null || storm.lon == null || !Number.isFinite(storm.lat) || !Number.isFinite(storm.lon)) return;
      L.circleMarker([storm.lat, storm.lon], {
        radius: 9,
        color: "#7f1d1d",
        weight: 3,
        fillColor: "#ef4444",
        fillOpacity: 0.9,
      })
        .bindTooltip(`${escapeHtml(stormLabel)}: ${escapeHtml(storm.name)}`)
        .bindPopup(`<strong>${escapeHtml(storm.name)}</strong><br/>${escapeHtml(stormLabel)}`)
        .addTo(g);
    });
    shelters.forEach((s) => {
      L.circleMarker([s.lat, s.lon], {
        radius: 7,
        color: s.status === "demo" ? "#F59E0B" : "#176B91",
        fillOpacity: 0.8,
      })
        .bindPopup(`<strong>${escapeHtml(s.name)}</strong><br/>${escapeHtml(s.address)}`)
        .on("click", () => onSelect?.(s))
        .addTo(g);
    });
    supportSites.forEach((s) => {
      L.circleMarker([s.lat, s.lon], {
        radius: 9,
        color: "#166534",
        fillColor: "#4ADE80",
        fillOpacity: 0.95,
      })
        .bindTooltip(supportLabel)
        .bindPopup(`<strong>${escapeHtml(s.name)}</strong><br/>${escapeHtml(s.address)}${s.city ? `, ${escapeHtml(s.city)}` : ""}<br/><strong>${escapeHtml(supportLabel)}</strong><br/>${escapeHtml(s.services.map((service) => supportServiceLabels[service]).join(", "))}<br/><a href="${escapeHtml(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel)}</a>`)
        .addTo(g);
    });
    historicalShelters.forEach((s) => {
      L.circleMarker([s.lat, s.lon], {
        radius: 8,
        color: "#7047A3",
        fillColor: "#A78BFA",
        fillOpacity: 0.9,
        dashArray: "3 3",
      })
        .bindTooltip(historicalLabel)
        .bindPopup(`<strong>${escapeHtml(s.name)}</strong><br/>${escapeHtml(s.address)}, ${escapeHtml(s.city)}<br/><strong>${escapeHtml(historicalLabel)}</strong><br/>${escapeHtml(s.event)} · ${escapeHtml(s.eventDate)}<br/>${escapeHtml(historicalDisclaimer)}`)
        .addTo(g);
    });
  }, [shelters, storms, stormLabel, centerLabel, supportSites, supportLabel, supportServiceLabels, sourceLabel, historicalShelters, historicalLabel, historicalDisclaimer, center.lat, center.lon, offlineMode, onSelect]);

  return (
    <div className="relative">
      <div
        ref={el}
        className="h-72 w-full overflow-hidden rounded-2xl bg-sky-50"
        role="application"
        aria-label="Map"
      />
      {offlineMode && (
        <p className="pointer-events-none absolute left-2 top-2 z-[1000] max-w-[85%] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-navy shadow">
          {offlineLabel}
        </p>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
