import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { NEIGHBORHOODS } from "../data/neighborhoods";
import { geocodeZip, requestGps } from "../services/location";
import { Button } from "./ui";

/** Location bar: GPS → neighborhood list (trolley-style) → ZIP code. */
export function LocationPicker() {
  const { location, setLocation, net } = useApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function useGps() {
    setBusy(true);
    setMsg(null);
    try {
      await setLocation(await requestGps());
      setOpen(false);
    } catch (e) {
      setMsg(t((e as Error).message === "denied" ? "loc.denied" : "loc.unavailable"));
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function useZip() {
    if (!/^\d{5}$/.test(zip)) return setMsg(t("loc.zipInvalid"));
    if (net === "offline") return setMsg(t("loc.zipOffline"));
    setBusy(true);
    try {
      await setLocation(await geocodeZip(zip));
      setOpen(false);
      setMsg(null);
    } catch {
      setMsg(t("common.unavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 rounded-2xl bg-ocean px-3 py-2 text-white">
        <MapPin size={18} aria-hidden />
        <button className="min-h-10 flex-1 text-left font-semibold" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {location?.label ?? t("loc.default")}
        </button>
        <button onClick={useGps} disabled={busy} className="flex min-h-10 items-center gap-1 rounded-xl bg-white/15 px-3 text-xs font-semibold" aria-label={t("loc.useGps")}>
          <LocateFixed size={16} aria-hidden /> GPS
        </button>
      </div>
      {open && (
        <div className="mt-2 rounded-2xl bg-white p-3 shadow-sm">
          {msg && <p className="mb-2 text-sm text-danger">{msg}</p>}
          <p className="mb-2 text-sm font-semibold">{t("loc.pick")}</p>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {NEIGHBORHOODS.map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  await setLocation({ lat: n.lat, lon: n.lon, label: `${n.name}, Miami`, source: "default", at: Date.now() });
                  setOpen(false);
                }}
                className={`min-h-11 rounded-xl border px-2 text-sm font-medium ${location?.label.startsWith(n.name) ? "border-teal bg-teal text-white" : "border-navy/10 bg-mist hover:border-teal"}`}
              >
                {n.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              placeholder={t("loc.zip")}
              aria-label={t("loc.zip")}
              className="min-h-11 flex-1 rounded-xl border border-navy/15 px-3"
            />
            <Button onClick={useZip} disabled={busy}>{t("loc.zipGo")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
