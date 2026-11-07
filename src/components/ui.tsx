// Shared UI building blocks — keep every screen visually consistent.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CircleAlert, Clock, ExternalLink, FlaskConical, Radio } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { timeAgo } from "../logic/format";
import type { DataOrigin } from "../types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/5 ${className}`}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/60">{children}</h2>
      {action}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-teal text-white hover:bg-teal/90",
  secondary: "bg-ocean/10 text-ocean hover:bg-ocean/15",
  danger: "bg-danger text-white hover:bg-danger/90",
  ghost: "text-ocean hover:bg-ocean/10",
};
export function Button({
  children, variant = "primary", className = "", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${BTN[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "teal" | "warn" | "danger" | "ocean" | "navy" }) {
  const tones = {
    gray: "bg-navy/5 text-navy/70",
    teal: "bg-teal/15 text-teal-800",
    warn: "bg-warn/15 text-amber-800",
    danger: "bg-danger/10 text-danger",
    ocean: "bg-ocean/10 text-ocean",
    navy: "bg-navy text-white",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Tells the user whether data is live, a saved copy, or simulated. */
export function OriginBadge({ origin }: { origin: DataOrigin | null }) {
  const { t } = useI18n();
  if (!origin) return null;
  if (origin === "demo") return <Badge tone="navy"><FlaskConical size={12} aria-hidden />{t("origin.demo")}</Badge>;
  if (origin === "cached") return <Badge tone="warn"><Clock size={12} aria-hidden />{t("origin.cached")}</Badge>;
  return <Badge tone="teal"><Radio size={12} aria-hidden />{t("origin.live")}</Badge>;
}

export function Freshness({ fetchedAt, origin }: { fetchedAt: number | null; origin: DataOrigin | null }) {
  const { t, lang } = useI18n();
  if (!fetchedAt) return null;
  return (
    <div className="mt-2 text-xs text-navy/60">
      <span className="mr-2">{t("common.updated", { when: timeAgo(fetchedAt, lang) })}</span>
      <OriginBadge origin={origin} />
      {origin === "cached" && (
        <p className="mt-1 flex items-center gap-1 text-amber-800">
          <CircleAlert size={12} aria-hidden /> {t("stale.warning")}
        </p>
      )}
    </div>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ocean underline-offset-2 hover:underline">
      {children} <ExternalLink size={12} aria-hidden />
    </a>
  );
}

export function NavRow({ to, icon, label, hint }: { to: string; icon: ReactNode; label: string; hint?: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-navy/5 hover:ring-teal/50">
      <span className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-navy/60">{hint}</span>}
      </span>
      <ChevronRight size={18} className="text-navy/40" aria-hidden />
    </Link>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, id, ...rest } = props;
  const inputId = id ?? `in-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className="block text-sm">
      <span className="mb-1 block font-medium text-navy/80">{label}</span>
      <input id={inputId} {...rest} className="min-h-11 w-full rounded-xl border border-navy/15 bg-white px-3 py-2 text-base outline-none focus:border-teal" />
    </label>
  );
}
