import { useState, type ReactNode } from "react";
import { Bell, CloudLightning, FlaskConical, Languages, Wifi, WifiOff } from "lucide-react";
import { BottomNav, SideNav } from "./BottomNav";
import { NotificationCenter } from "./NotificationCenter";
import { useApp } from "../hooks/AppState";
import { useI18n } from "../i18n/I18nContext";
import { timeAgo } from "../logic/format";

export function Layout({ children }: { children: ReactNode }) {
  const { net, demo, lastSyncAt, alerts } = useApp();
  const { t, lang, setLang } = useI18n();
  const [notifOpen, setNotifOpen] = useState(false);
  const offline = net === "offline";
  const alertCount = alerts.data?.length ?? 0;

  return (
    <div className="flex min-h-full">
      <SideNav />
      <div className="min-w-0 flex-1">
        <header className="safe-top sticky top-0 z-30 bg-navy text-white shadow">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <CloudLightning className="text-teal lg:hidden" aria-hidden />
            <span className="flex-1 truncate text-lg font-bold lg:invisible">{t("app.name")}</span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${offline ? "bg-warn text-navy" : "bg-white/10"}`}
              role="status"
              aria-live="polite"
            >
              {offline ? <WifiOff size={14} aria-hidden /> : <Wifi size={14} aria-hidden />}
              {t(offline ? "net.offline" : net === "online" ? "net.online" : "net.checking")}
            </span>
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold hover:bg-white/10"
              aria-label={`${t("set.language")}: ${lang === "en" ? "English" : "Español"}`}
            >
              <Languages size={18} aria-hidden /> {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative grid size-11 place-items-center rounded-xl hover:bg-white/10"
              aria-label={t("notif.title")}
            >
              <Bell size={20} aria-hidden />
              {alertCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-danger text-[10px] font-bold">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
          {demo && (
            <div className="flex items-center justify-center gap-2 bg-warn px-4 py-1.5 text-center text-xs font-bold text-navy">
              <FlaskConical size={14} aria-hidden /> {t("demo.banner")}
            </div>
          )}
          {offline && (
            <div className="bg-ocean px-4 py-2 text-center text-xs">
              <strong>{t("net.offlineBanner")}</strong>{" "}
              {lastSyncAt ? t("net.lastSync", { when: timeAgo(lastSyncAt, lang) }) : t("net.never")}
            </div>
          )}
        </header>
        <main className="pb-nav mx-auto max-w-3xl px-4 pt-4">{children}</main>
      </div>
      <BottomNav />
      {notifOpen && <NotificationCenter onClose={() => setNotifOpen(false)} />}
    </div>
  );
}
