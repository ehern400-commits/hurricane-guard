export type DonationCategory = "money" | "blood" | "volunteer" | "goods";

export interface DonationResource {
  id: string;
  name: string;
  category: DonationCategory;
  description: { en: string; es: string };
  url: string;
  phone?: string;
}

export interface DropOffSite {
  name: string;
  address: string;
  city?: string;
  lat: number;
  lon: number;
  services: ("food" | "supplies" | "donations")[];
  accepts: string[];
  sourceUrl: string;
  verifiedOn: string;
  activeFrom: string;
  activeThrough: string;
}

export function getActiveDropOffSites(
  now = new Date(),
  sites: DropOffSite[] = dropOffSites,
): DropOffSite[] {
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now);
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 18);
  cutoff.setUTCDate(Math.min(
    now.getUTCDate(),
    new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate(),
  ));
  const verifiedSince = cutoff.toISOString().slice(0, 10);
  return sites.filter((site) =>
    site.activeFrom <= today &&
    site.activeThrough >= today &&
    site.verifiedOn >= verifiedSince,
  );
}

export const DONATION_RESOURCES: DonationResource[] = [
  {
    id: "red-cross-donate",
    name: "American Red Cross",
    category: "money",
    description: {
      en: "Support disaster relief and recovery through the American Red Cross.",
      es: "Apoya la ayuda y recuperación ante desastres a través de la Cruz Roja Americana.",
    },
    url: "https://www.redcross.org/donate",
  },
  {
    id: "florida-disaster-fund",
    name: "Florida Disaster Fund by Volunteer Florida",
    category: "money",
    description: {
      en: "Florida's official private fund for responding to and recovering from disasters.",
      es: "Fondo privado oficial de Florida para responder y recuperarse de desastres.",
    },
    url: "https://www.volunteerflorida.org",
  },
  {
    id: "nvoad",
    name: "National VOAD",
    category: "money",
    description: {
      en: "Learn about voluntary organizations coordinating disaster recovery and ways to support their work.",
      es: "Conoce las organizaciones voluntarias que coordinan la recuperación ante desastres y cómo apoyar su labor.",
    },
    url: "https://www.nvoad.org",
  },
  {
    id: "oneblood",
    name: "OneBlood",
    category: "blood",
    description: {
      en: "OneBlood is Florida's blood center. Visit its official site for blood donation information.",
      es: "OneBlood es el centro de sangre de Florida. Visita su sitio oficial para obtener información sobre donaciones de sangre.",
    },
    url: "https://www.oneblood.org",
  },
  {
    id: "volunteer-florida",
    name: "Volunteer Florida",
    category: "volunteer",
    description: {
      en: "Find official information about volunteering and disaster response in Florida.",
      es: "Encuentra información oficial sobre voluntariado y respuesta a desastres en Florida.",
    },
    url: "https://www.volunteerflorida.org",
  },
  {
    id: "red-cross-volunteer",
    name: "American Red Cross",
    category: "volunteer",
    description: {
      en: "Explore volunteer opportunities with the American Red Cross.",
      es: "Explora oportunidades de voluntariado con la Cruz Roja Americana.",
    },
    url: "https://www.redcross.org/volunteer",
  },
  {
    id: "goods-guidance",
    name: "Donating goods",
    category: "goods",
    description: {
      en: "Only take donated items to drop-off sites announced by official sources for a specific storm. Check Miami-Dade Emergency Management for current guidance.",
      es: "Entrega artículos donados únicamente en los puntos anunciados por fuentes oficiales para una tormenta específica. Consulta la guía actual del Departamento de Manejo de Emergencias de Miami-Dade.",
    },
    url: "https://www.miamidade.gov/global/emergency/home.page",
  },
];

export const dropOffSites: DropOffSite[] = [];
