// Leaflet + OpenStreetMap map (online only — we do NOT bulk-download OSM tiles,
// which their usage policy forbids). The shelter LIST is the offline fallback.
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EmergencyShelter } from "../types";

interface Props {
  center: { lat: number; lon: number };
  shelters: EmergencyShelter[];
  onSelect?: (s: EmergencyShelter) => void;
}

export default function MapView({ center, shelters, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([center.lat, center.lon], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setView([center.lat, center.lon], map.current.getZoom());
  }, [center.lat, center.lon]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    L.circleMarker([center.lat, center.lon], { radius: 8, color: "#10283E", fillColor: "#20B7AD", fillOpacity: 1 })
      .bindTooltip("You / Tú")
      .addTo(g);
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
  }, [shelters, center.lat, center.lon, onSelect]);

  return <div ref={el} className="h-72 w-full overflow-hidden rounded-2xl" role="application" aria-label="Map" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
