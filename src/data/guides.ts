// Emergency guide content, stored in the app bundle so it works fully offline.
// Summarized from Ready.gov, FEMA, NWS and CDC guidance (links per section).
import type { Lang } from "../types";

export interface GuideSection {
  id: string;
  phase: "before" | "during" | "after";
  title: Record<Lang, string>;
  tips: Record<Lang, string[]>;
  source: { name: string; url: string };
}

export const GUIDES: GuideSection[] = [
  {
    id: "prep", phase: "before",
    title: { en: "Get prepared", es: "Prepárate" },
    tips: {
      en: ["Know your evacuation zone and your route out.", "Build a kit with supplies for several days per person.", "Write down important phone numbers on paper in case your phone dies.", "Sign up for Miami-Dade and NWS alerts."],
      es: ["Conoce tu zona de evacuación y tu ruta de salida.", "Arma un kit con suministros para varios días por persona.", "Anota en papel los números importantes por si tu teléfono se apaga.", "Inscríbete en las alertas de Miami-Dade y del NWS."],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "supplies", phase: "before",
    title: { en: "Emergency supplies", es: "Suministros de emergencia" },
    tips: {
      en: ["Water: about one gallon per person per day.", "Non-perishable food, manual can opener.", "Flashlights, extra batteries, battery or crank radio.", "First-aid kit, prescriptions, copies of documents in a waterproof bag."],
      es: ["Agua: alrededor de un galón por persona por día.", "Comida no perecedera y abrelatas manual.", "Linternas, baterías extra, radio de baterías o de manivela.", "Botiquín, recetas médicas y copias de documentos en bolsa impermeable."],
    },
    source: { name: "Ready.gov — Build a Kit", url: "https://www.ready.gov/kit" },
  },
  {
    id: "home", phase: "before",
    title: { en: "Secure your home", es: "Asegura tu casa" },
    tips: {
      en: ["Install shutters or board up windows.", "Bring in outdoor furniture, grills and anything that can fly.", "Charge phones and power banks; fill vehicle gas tank.", "Move valuables and documents to a high, dry place."],
      es: ["Instala tormenteras o cubre las ventanas.", "Entra muebles de patio, parrillas y todo lo que pueda volar.", "Carga teléfonos y baterías portátiles; llena el tanque del auto.", "Pon objetos de valor y documentos en un lugar alto y seco."],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "evac", phase: "before",
    title: { en: "Evacuation planning", es: "Plan de evacuación" },
    tips: {
      en: ["If officials order you to evacuate, go.", "Plan where you will go: friends, family, hotel, or an evacuation center.", "Plan for pets — not every shelter accepts them.", "Agree on a family meeting point and an out-of-town contact."],
      es: ["Si las autoridades ordenan evacuar, hazlo.", "Decide a dónde irás: amigos, familia, hotel o centro de evacuación.", "Planifica para tus mascotas: no todos los refugios las aceptan.", "Acuerden un punto de encuentro y un contacto fuera de la ciudad."],
    },
    source: { name: "Miami-Dade Emergency Management", url: "https://www.miamidade.gov/global/emergency/home.page" },
  },
  {
    id: "indoor", phase: "during",
    title: { en: "Stay safe indoors", es: "Mantente seguro adentro" },
    tips: {
      en: ["Stay in a small interior room, closet or hallway away from windows.", "Do not go outside during the eye — winds return quickly.", "Keep a battery radio on for official updates.", "Text instead of calling; texts often get through when calls fail."],
      es: ["Quédate en un cuarto interior pequeño, clóset o pasillo lejos de ventanas.", "No salgas durante el ojo del huracán: el viento regresa rápido.", "Mantén un radio de baterías encendido para noticias oficiales.", "Envía mensajes de texto en vez de llamar; suelen llegar cuando las llamadas fallan."],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "flood", phase: "during",
    title: { en: "Flooding", es: "Inundaciones" },
    tips: {
      en: ["Turn Around, Don't Drown: never walk or drive through flood water.", "Just 6 inches of moving water can knock you down; 1 foot can sweep a car away.", "Move to higher ground if water rises."],
      es: ["Da la vuelta, no te ahogues: nunca camines ni manejes por agua inundada.", "Solo 6 pulgadas de agua en movimiento pueden tumbarte; 1 pie puede arrastrar un auto.", "Sube a un lugar más alto si el agua sube."],
    },
    source: { name: "NWS — Turn Around Don't Drown", url: "https://www.weather.gov/safety/flood-turn-around-dont-drown" },
  },
  {
    id: "power", phase: "during",
    title: { en: "Power outages", es: "Apagones" },
    tips: {
      en: ["Never run a generator indoors, in a garage, or near windows — carbon monoxide kills.", "Use flashlights, not candles.", "Keep fridge and freezer doors closed.", "Unplug appliances to avoid surge damage when power returns."],
      es: ["Nunca uses un generador adentro, en el garaje ni cerca de ventanas: el monóxido de carbono mata.", "Usa linternas, no velas.", "Mantén cerradas las puertas del refrigerador y congelador.", "Desconecta aparatos para evitar daños cuando vuelva la luz."],
    },
    source: { name: "Ready.gov — Power Outages", url: "https://www.ready.gov/power-outages" },
  },
  {
    id: "return", phase: "after",
    title: { en: "Returning home", es: "Regresar a casa" },
    tips: {
      en: ["Return only when officials say it is safe.", "Watch for downed power lines and report them; stay far away.", "Take photos of damage for insurance before cleaning up."],
      es: ["Regresa solo cuando las autoridades digan que es seguro.", "Cuidado con cables eléctricos caídos; repórtalos y aléjate.", "Toma fotos de los daños para el seguro antes de limpiar."],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "food", phase: "after",
    title: { en: "Food and water safety", es: "Seguridad de agua y alimentos" },
    tips: {
      en: ["When in doubt, throw it out.", "Throw away refrigerated food (meat, milk, leftovers) after 4+ hours without power.", "Follow any boil-water notice from officials."],
      es: ["Si tienes dudas, bótalo.", "Bota comida refrigerada (carne, leche, sobras) después de 4+ horas sin electricidad.", "Sigue cualquier aviso oficial de hervir el agua."],
    },
    source: { name: "FoodSafety.gov", url: "https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage" },
  },
  {
    id: "damage", phase: "after",
    title: { en: "Report damage & get help", es: "Reportar daños y pedir ayuda" },
    tips: {
      en: ["Call 311 for non-emergency county issues (debris, road hazards).", "Apply for federal aid only at DisasterAssistance.gov or 1-800-621-3362 — FEMA never charges a fee.", "Watch out for scams and unlicensed contractors."],
      es: ["Llama al 311 para problemas no urgentes del condado (escombros, peligros en vías).", "Solicita ayuda federal solo en DisasterAssistance.gov o al 1-800-621-3362: FEMA nunca cobra.", "Cuidado con estafas y contratistas sin licencia."],
    },
    source: { name: "FEMA", url: "https://www.fema.gov/assistance/individual" },
  },
];
