import { useState } from "react";
import { CloudOff, Droplets, HandHeart, MapPin, Navigation, Package, ShieldCheck, Users } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { DONATION_RESOURCES, dropOffSites, type DonationCategory } from "../data/donate";
import { Badge, Card, ExtLink, PageHeader, SectionTitle } from "../components/ui";
import type { I18nKey } from "../i18n/en";

type CategoryFilter = DonationCategory | "all";

const CATEGORIES: { id: CategoryFilter; Icon: typeof HandHeart }[] = [
  { id: "all", Icon: HandHeart },
  { id: "money", Icon: HandHeart },
  { id: "blood", Icon: Droplets },
  { id: "volunteer", Icon: Users },
  { id: "goods", Icon: Package },
];

function directionsUrl(site: (typeof dropOffSites)[number]) {
  return `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lon}`;
}

export default function Donate() {
  const { t, lang } = useI18n();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const resources = DONATION_RESOURCES.filter((resource) => category === "all" || resource.category === category);

  return (
    <div>
      <PageHeader
        title={t("donate.title")}
        subtitle={t("donate.subtitle")}
        action={<Badge tone="teal"><CloudOff size={12} aria-hidden />{t("guide.offlineOk")}</Badge>}
      />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t("donate.title")}>
        {CATEGORIES.map(({ id, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={category === id}
            onClick={() => setCategory(id)}
            className={`flex min-h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold ${category === id ? "bg-teal text-white" : "bg-white text-navy ring-1 ring-navy/10"}`}
          >
            <Icon size={16} aria-hidden /> {t(`donate.category.${id}` as I18nKey)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-semibold">{resource.name}</h2>
              <Badge tone="ocean">{t(`donate.category.${resource.category}` as I18nKey)}</Badge>
            </div>
            <p className="text-sm text-navy/70">{resource.description[lang === "es" ? "es" : "en"]}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ExtLink href={resource.url}>{t("donate.openSite")}</ExtLink>
              {resource.phone && (
                <a href={`tel:${resource.phone}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ocean">
                  {resource.phone}
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>{t("donate.scamsTitle")}</SectionTitle>
      <Card>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />{t("donate.scam.website")}</li>
          <li className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />{t("donate.scam.payment")}</li>
          <li className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />{t("donate.scam.urgent")}</li>
          <li className="flex flex-wrap gap-1">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
            <span>{t("donate.scam.check")}</span>
            <ExtLink href="https://give.org">Give.org</ExtLink>
            <span>{t("donate.scam.or")}</span>
            <ExtLink href="https://www.charitynavigator.org">Charity Navigator</ExtLink>.
          </li>
        </ul>
        <p className="mt-3 text-sm">
          {t("donate.scam.learn")}{" "}
          <ExtLink href="https://consumer.ftc.gov/features/how-donate-wisely-and-avoid-charity-scams">{t("donate.scam.ftc")}</ExtLink>
        </p>
      </Card>

      <SectionTitle>{t("donate.dropOffTitle")}</SectionTitle>
      {dropOffSites.length === 0 ? (
        <Card>
          <p className="text-sm text-navy/70">{t("donate.noDropOffSites")}</p>
          <p className="mt-2 text-sm"><ExtLink href="https://www.miamidade.gov/global/emergency/home.page">{t("donate.officialChannels")}</ExtLink></p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {dropOffSites.map((site) => (
            <li key={`${site.name}-${site.address}`}>
              <Card className="!p-3">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-ocean" aria-hidden />
                  <div className="flex-1">
                    <p className="font-semibold">{site.name}</p>
                    <p className="text-sm text-navy/70">{site.address}</p>
                    <p className="mt-1 text-xs text-navy/60">{t("donate.accepts")}: {site.accepts.join(", ")}</p>
                    <p className="text-xs text-navy/50">{t("donate.verifiedOn")}: {site.verifiedOn}</p>
                    <p className="mt-1 text-xs"><ExtLink href={site.sourceUrl}>{t("common.source")}</ExtLink></p>
                  </div>
                </div>
                <a href={directionsUrl(site)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-xl bg-ocean/10 px-3 text-sm font-semibold text-ocean">
                  <Navigation size={14} aria-hidden /> {t("common.directions")}
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
