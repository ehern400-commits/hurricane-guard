// Trolley-app-style fixed bottom navigation (mobile) / sidebar (desktop ≥1024px).
import { NavLink } from "react-router-dom";
import { CloudLightning, House, Map as MapIcon, Package, ShieldCheck, Wind } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import type { I18nKey } from "../i18n/en";

export const TABS: { to: string; key: I18nKey; Icon: typeof House }[] = [
  { to: "/", key: "nav.home", Icon: House },
  { to: "/storms", key: "nav.storms", Icon: CloudLightning },
  { to: "/map", key: "nav.map", Icon: MapIcon },
  { to: "/impact", key: "nav.impact", Icon: Package },
  { to: "/safety", key: "nav.safety", Icon: ShieldCheck },
];

export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav
      aria-label="Main"
      className="bottom-nav safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ to, key, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? "text-teal" : "text-navy/55 hover:text-navy"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? "bg-teal/15" : ""}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                  </span>
                  {t(key)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const { t } = useI18n();
  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 bg-navy p-4 text-white lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
        <Wind className="text-teal" aria-hidden /> {t("app.name")}
      </div>
      {TABS.map(({ to, key, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium ${isActive ? "bg-teal text-white" : "text-white/75 hover:bg-white/10"}`
          }
        >
          <Icon size={20} aria-hidden /> {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}
