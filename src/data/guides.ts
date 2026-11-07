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
    title: { en: "Get prepared", es: "Prepárate", ht: "Prepare", pt: "Prepare-se", fr: "Préparez-vous", zh: "做好准备" },
    tips: {
      en: ["Know your evacuation zone and your route out.", "Build a kit with supplies for several days per person.", "Write down important phone numbers on paper in case your phone dies.", "Sign up for Miami-Dade and NWS alerts."],
      es: ["Conoce tu zona de evacuación y tu ruta de salida.", "Arma un kit con suministros para varios días por persona.", "Anota en papel los números importantes por si tu teléfono se apaga.", "Inscríbete en las alertas de Miami-Dade y del NWS."],
      ht: ["Konnen zòn evakyasyon ou ak wout pou soti ladan l.", "Prepare yon twous ak pwovizyon pou plizyè jou pou chak moun.", "Ekri nimewo telefòn enpòtan yo sou papye sizoka telefòn ou mouri.", "Enskri pou resevwa alèt Miami-Dade ak NWS."],
      pt: ["Conheça sua zona de evacuação e a rota para sair.", "Monte um kit com suprimentos para vários dias para cada pessoa.", "Anote números de telefone importantes no papel caso seu celular descarregue.", "Cadastre-se para receber alertas de Miami-Dade e do NWS."],
      fr: ["Connaissez votre zone d’évacuation et l’itinéraire pour en sortir.", "Préparez une trousse avec des provisions pour plusieurs jours par personne.", "Notez les numéros importants sur papier au cas où votre téléphone serait déchargé.", "Inscrivez-vous aux alertes de Miami-Dade et du NWS."],
      zh: ["了解您的疏散区域以及撤离路线。", "为每个人准备一套可维持数天的应急物资。", "把重要电话号码写在纸上，以防手机没电。", "注册接收迈阿密-戴德县和美国国家气象局（NWS）的警报。"],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "supplies", phase: "before",
    title: { en: "Emergency supplies", es: "Suministros de emergencia", ht: "Pwovizyon ijans", pt: "Suprimentos de emergência", fr: "Provisions d’urgence", zh: "应急物资" },
    tips: {
      en: ["Water: about one gallon per person per day.", "Non-perishable food, manual can opener.", "Flashlights, extra batteries, battery or crank radio.", "First-aid kit, prescriptions, copies of documents in a waterproof bag."],
      es: ["Agua: alrededor de un galón por persona por día.", "Comida no perecedera y abrelatas manual.", "Linternas, baterías extra, radio de baterías o de manivela.", "Botiquín, recetas médicas y copias de documentos en bolsa impermeable."],
      ht: ["Dlo: anviwon yon galon pou chak moun chak jou.", "Manje ki pa gate fasil ak yon ouv-bwat manyèl.", "Flach, pil anplis, ak radyo ki mache ak pil oswa ak manivèl.", "Twous premye swen, preskripsyon medikaman, ak kopi dokiman nan yon sak ki pa kite dlo antre."],
      pt: ["Água: cerca de 3,8 litros por pessoa por dia.", "Alimentos não perecíveis e um abridor de latas manual.", "Lanternas, pilhas extras e rádio a pil ou de manivela.", "Kit de primeiros socorros, receitas médicas e cópias de documentos em um saco impermeável."],
      fr: ["Eau : environ 3,8 litres par personne et par jour.", "Aliments non périssables et ouvre-boîte manuel.", "Lampes de poche, piles supplémentaires et radio à piles ou à manivelle.", "Trousse de premiers secours, ordonnances et copies de documents dans un sac étanche."],
      zh: ["饮用水：每人每天约3.8升。", "不易变质的食物和手动开罐器。", "手电筒、备用电池，以及电池或手摇收音机。", "急救包、处方药，以及装在防水袋中的证件副本。"],
    },
    source: { name: "Ready.gov — Build a Kit", url: "https://www.ready.gov/kit" },
  },
  {
    id: "home", phase: "before",
    title: { en: "Secure your home", es: "Asegura tu casa", ht: "Pwoteje kay ou", pt: "Proteja sua casa", fr: "Protégez votre domicile", zh: "加固住房" },
    tips: {
      en: ["Install shutters or board up windows.", "Bring in outdoor furniture, grills and anything that can fly.", "Charge phones and power banks; fill vehicle gas tank.", "Move valuables and documents to a high, dry place."],
      es: ["Instala tormenteras o cubre las ventanas.", "Entra muebles de patio, parrillas y todo lo que pueda volar.", "Carga teléfonos y baterías portátiles; llena el tanque del auto.", "Pon objetos de valor y documentos en un lugar alto y seco."],
      ht: ["Enstale panno pwoteksyon oswa mete planch sou fenèt yo.", "Mete mèb deyò, gri ak tout bagay van ka pote anndan.", "Chaje telefòn ak batri pòtab; plen tank machin nan gaz.", "Mete bagay ki gen valè ak dokiman yo yon kote ki wo epi sèk."],
      pt: ["Instale persianas de proteção ou cubra as janelas com tábuas.", "Guarde móveis externos, churrasqueiras e tudo que possa ser levado pelo vento.", "Carregue celulares e baterias portáteis; encha o tanque do veículo.", "Coloque objetos de valor e documentos em um local alto e seco."],
      fr: ["Installez des volets ou barricadez les fenêtres avec des planches.", "Rentrez les meubles d’extérieur, les barbecues et tout objet pouvant être emporté par le vent.", "Rechargez les téléphones et batteries externes ; faites le plein du véhicule.", "Placez les objets de valeur et les documents en hauteur, dans un endroit sec."],
      zh: ["安装防风百叶窗或用木板封住窗户。", "把户外家具、烧烤架和可能被风吹走的物品搬进室内。", "给手机和充电宝充电；给车辆加满油。", "把贵重物品和证件放在高处干燥的地方。"],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "evac", phase: "before",
    title: { en: "Evacuation planning", es: "Plan de evacuación", ht: "Planifikasyon evakyasyon", pt: "Planejamento da evacuação", fr: "Planification de l’évacuation", zh: "疏散计划" },
    tips: {
      en: ["If officials order you to evacuate, go.", "Plan where you will go: friends, family, hotel, or an evacuation center.", "Plan for pets — not every shelter accepts them.", "Agree on a family meeting point and an out-of-town contact."],
      es: ["Si las autoridades ordenan evacuar, hazlo.", "Decide a dónde irás: amigos, familia, hotel o centro de evacuación.", "Planifica para tus mascotas: no todos los refugios las aceptan.", "Acuerden un punto de encuentro y un contacto fuera de la ciudad."],
      ht: ["Si otorite yo bay lòd pou evakye, ale.", "Planifye kote w ap ale: kay zanmi oswa fanmi, otèl, oswa sant evakyasyon.", "Planifye pou bèt kay yo — se pa tout abri ki aksepte yo.", "Dakò sou yon kote fanmi an ap rankontre ak yon kontak ki pa nan vil la."],
      pt: ["Se as autoridades ordenarem a evacuação, saia.", "Planeje para onde ir: casa de amigos ou familiares, hotel ou centro de evacuação.", "Planeje para os animais de estimação — nem todo abrigo os aceita.", "Combine um ponto de encontro da família e um contato fora da cidade."],
      fr: ["Si les autorités ordonnent l’évacuation, partez.", "Prévoyez où aller : chez des amis ou des proches, à l’hôtel ou dans un centre d’évacuation.", "Prévoyez une solution pour vos animaux — tous les refuges ne les acceptent pas.", "Convenez d’un lieu de rendez-vous familial et d’un contact hors de la ville."],
      zh: ["如果政府部门下令疏散，请立即撤离。", "提前决定去哪里：朋友或亲属家、酒店或疏散中心。", "为宠物做好安排——并非所有避难所都接收宠物。", "约定家庭集合地点，并确定一位外地联系人。"],
    },
    source: { name: "Miami-Dade Emergency Management", url: "https://www.miamidade.gov/global/emergency/home.page" },
  },
  {
    id: "indoor", phase: "during",
    title: { en: "Stay safe indoors", es: "Mantente seguro adentro", ht: "Rete an sekirite anndan", pt: "Fique em segurança dentro de casa", fr: "Restez en sécurité à l’intérieur", zh: "在室内确保安全" },
    tips: {
      en: ["Stay in a small interior room, closet or hallway away from windows.", "Do not go outside during the eye — winds return quickly.", "Keep a battery radio on for official updates.", "Text instead of calling; texts often get through when calls fail."],
      es: ["Quédate en un cuarto interior pequeño, clóset o pasillo lejos de ventanas.", "No salgas durante el ojo del huracán: el viento regresa rápido.", "Mantén un radio de baterías encendido para noticias oficiales.", "Envía mensajes de texto en vez de llamar; suelen llegar cuando las llamadas fallan."],
      ht: ["Rete nan yon ti chanm anndan kay la, nan yon klozèt oswa yon koulwa, lwen fenèt.", "Pa soti pandan je siklòn nan ap pase — van yo retounen rapid.", "Kenbe yon radyo ak pil limen pou resevwa nouvèl ofisyèl.", "Voye mesaj tèks olye w rele; mesaj yo souvan pase lè apèl yo pa pase."],
      pt: ["Fique em um cômodo interno pequeno, armário ou corredor, longe das janelas.", "Não saia durante a passagem do olho do furacão — os ventos voltam rapidamente.", "Mantenha um rádio a pil ligado para receber atualizações oficiais.", "Envie mensagens de texto em vez de ligar; elas costumam funcionar quando as chamadas falham."],
      fr: ["Restez dans une petite pièce intérieure, un placard ou un couloir, loin des fenêtres.", "Ne sortez pas pendant le passage de l’œil — les vents reviennent rapidement.", "Laissez une radio à piles allumée pour suivre les informations officielles.", "Envoyez un texto plutôt que d’appeler ; les textos passent souvent quand les appels échouent."],
      zh: ["待在远离窗户的室内小房间、壁橱或走廊。", "飓风眼经过时不要外出——风很快会再次袭来。", "打开电池收音机，收听官方最新消息。", "尽量发短信而非打电话；电话打不通时短信通常仍能发送。"],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "flood", phase: "during",
    title: { en: "Flooding", es: "Inundaciones", ht: "Inondasyon", pt: "Inundações", fr: "Inondations", zh: "洪水" },
    tips: {
      en: ["Turn Around, Don't Drown: never walk or drive through flood water.", "Just 6 inches of moving water can knock you down; 1 foot can sweep a car away.", "Move to higher ground if water rises."],
      es: ["Da la vuelta, no te ahogues: nunca camines ni manejes por agua inundada.", "Solo 6 pulgadas de agua en movimiento pueden tumbarte; 1 pie puede arrastrar un auto.", "Sube a un lugar más alto si el agua sube."],
      ht: ["Vire tounen, pa neye: pa janm mache oswa kondwi nan dlo inondasyon.", "Se sèlman 6 pous dlo k ap koule ki ka fè w tonbe; 1 pye dlo ka pote yon machin ale.", "Ale sou tè ki pi wo si dlo a ap monte."],
      pt: ["Volte, não se afogue: nunca caminhe nem dirija em água de enchente.", "Apenas 15 cm de água corrente podem derrubar você; 30 cm podem arrastar um carro.", "Vá para um terreno mais alto se a água subir."],
      fr: ["Faites demi-tour, ne vous noyez pas : ne marchez et ne conduisez jamais dans les eaux de crue.", "Seulement 15 cm d’eau en mouvement peuvent vous faire tomber ; 30 cm peuvent emporter une voiture.", "Gagnez un terrain plus élevé si l’eau monte."],
      zh: ["掉头，不要涉水：切勿步行或驾车穿过洪水。", "仅约15厘米深的流动水就能冲倒人；约30厘米深的水就可能冲走汽车。", "水位上涨时，转移到较高的地方。"],
    },
    source: { name: "NWS — Turn Around Don't Drown", url: "https://www.weather.gov/safety/flood-turn-around-dont-drown" },
  },
  {
    id: "power", phase: "during",
    title: { en: "Power outages", es: "Apagones", ht: "Kouran koupe", pt: "Falta de energia", fr: "Pannes de courant", zh: "停电" },
    tips: {
      en: ["Never run a generator indoors, in a garage, or near windows — carbon monoxide kills.", "Use flashlights, not candles.", "Keep fridge and freezer doors closed.", "Unplug appliances to avoid surge damage when power returns."],
      es: ["Nunca uses un generador adentro, en el garaje ni cerca de ventanas: el monóxido de carbono mata.", "Usa linternas, no velas.", "Mantén cerradas las puertas del refrigerador y congelador.", "Desconecta aparatos para evitar daños cuando vuelva la luz."],
      ht: ["Pa janm fè yon dèlko mache anndan kay, nan garaj oswa toupre fenèt — monoksid kabòn touye moun.", "Sèvi ak flach, pa sèvi ak bouji.", "Kenbe pòt frijidè ak frizè yo fèmen.", "Deploge aparèy yo pou evite domaj lè kouran an tounen."],
      pt: ["Nunca use gerador dentro de casa, na garagem ou perto de janelas — o monóxido de carbono pode matar.", "Use lanternas, não velas.", "Mantenha as portas da geladeira e do freezer fechadas.", "Tire os aparelhos da tomada para evitar danos quando a energia voltar."],
      fr: ["Ne faites jamais fonctionner un générateur à l’intérieur, dans un garage ou près de fenêtres — le monoxyde de carbone est mortel.", "Utilisez des lampes de poche, pas des bougies.", "Gardez les portes du réfrigérateur et du congélateur fermées.", "Débranchez les appareils pour éviter les dégâts dus aux surtensions au retour du courant."],
      zh: ["切勿在室内、车库或窗户附近运行发电机——一氧化碳会致命。", "使用手电筒，不要使用蜡烛。", "保持冰箱和冷冻柜门关闭。", "拔掉电器插头，以免来电时电涌造成损坏。"],
    },
    source: { name: "Ready.gov — Power Outages", url: "https://www.ready.gov/power-outages" },
  },
  {
    id: "return", phase: "after",
    title: { en: "Returning home", es: "Regresar a casa", ht: "Retounen lakay", pt: "Voltar para casa", fr: "Retour à la maison", zh: "返家" },
    tips: {
      en: ["Return only when officials say it is safe.", "Watch for downed power lines and report them; stay far away.", "Take photos of damage for insurance before cleaning up."],
      es: ["Regresa solo cuando las autoridades digan que es seguro.", "Cuidado con cables eléctricos caídos; repórtalos y aléjate.", "Toma fotos de los daños para el seguro antes de limpiar."],
      ht: ["Retounen sèlman lè otorite yo di li an sekirite.", "Veye fil elektrik ki tonbe; rapòte yo epi rete byen lwen yo.", "Pran foto domaj yo pou asirans anvan ou netwaye."],
      pt: ["Volte somente quando as autoridades disserem que é seguro.", "Cuidado com fios elétricos caídos; denuncie-os e mantenha distância.", "Fotografe os danos para o seguro antes de limpar."],
      fr: ["Ne rentrez que lorsque les autorités indiquent que vous pouvez le faire sans danger.", "Faites attention aux lignes électriques tombées ; signalez-les et restez à distance.", "Photographiez les dégâts pour l’assurance avant de nettoyer."],
      zh: ["只有在政府部门确认安全后才返回。", "留意掉落的电线，及时报告并远离。", "清理前先拍摄受损情况，供保险理赔使用。"],
    },
    source: { name: "Ready.gov", url: "https://www.ready.gov/hurricanes" },
  },
  {
    id: "food", phase: "after",
    title: { en: "Food and water safety", es: "Seguridad de agua y alimentos", ht: "Sekirite manje ak dlo", pt: "Segurança de alimentos e água", fr: "Sécurité alimentaire et de l’eau", zh: "食品和饮水安全" },
    tips: {
      en: ["When in doubt, throw it out.", "Throw away refrigerated food (meat, milk, leftovers) after 4+ hours without power.", "Follow any boil-water notice from officials."],
      es: ["Si tienes dudas, bótalo.", "Bota comida refrigerada (carne, leche, sobras) después de 4+ horas sin electricidad.", "Sigue cualquier aviso oficial de hervir el agua."],
      ht: ["Si ou pa sèten, jete l.", "Jete manje ki nan frijidè (vyann, lèt, rès manje) apre plis pase 4 èdtan san kouran.", "Swiv nenpòt avi otorite yo bay pou bouyi dlo."],
      pt: ["Na dúvida, jogue fora.", "Descarte alimentos refrigerados (carne, leite, sobras) após 4 horas ou mais sem energia.", "Siga qualquer aviso oficial para ferver a água."],
      fr: ["En cas de doute, jetez l’aliment.", "Jetez les aliments réfrigérés (viande, lait, restes) après au moins 4 heures sans électricité.", "Respectez tout avis officiel demandant de faire bouillir l’eau."],
      zh: ["无法确定是否安全时，就丢弃。", "停电4小时或更久后，丢弃冷藏食品（肉类、牛奶、剩菜）。", "遵守政府部门发布的任何煮沸饮水通知。"],
    },
    source: { name: "FoodSafety.gov", url: "https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage" },
  },
  {
    id: "damage", phase: "after",
    title: { en: "Report damage & get help", es: "Reportar daños y pedir ayuda", ht: "Rapòte domaj epi jwenn èd", pt: "Relate danos e peça ajuda", fr: "Signaler les dégâts et obtenir de l’aide", zh: "报告损失并寻求帮助" },
    tips: {
      en: ["Call 311 for non-emergency county issues (debris, road hazards).", "Apply for federal aid only at DisasterAssistance.gov or 1-800-621-3362 — FEMA never charges a fee.", "Watch out for scams and unlicensed contractors."],
      es: ["Llama al 311 para problemas no urgentes del condado (escombros, peligros en vías).", "Solicita ayuda federal solo en DisasterAssistance.gov o al 1-800-621-3362: FEMA nunca cobra.", "Cuidado con estafas y contratistas sin licencia."],
      ht: ["Rele 311 pou pwoblèm nan konte a ki pa ijans (debri, danje sou wout).", "Mande èd federal sèlman sou DisasterAssistance.gov oswa nan 1-800-621-3362 — FEMA pa janm mande frè.", "Pran prekosyon ak magouy ak kontraktè ki pa gen lisans."],
      pt: ["Ligue para 311 para problemas não emergenciais do condado (destroços, perigos nas vias).", "Solicite ajuda federal somente em DisasterAssistance.gov ou pelo 1-800-621-3362 — a FEMA nunca cobra taxa.", "Cuidado com golpes e empreiteiros sem licença."],
      fr: ["Appelez le 311 pour les problèmes non urgents du comté (débris, dangers sur la route).", "Demandez une aide fédérale uniquement sur DisasterAssistance.gov ou au 1-800-621-3362 — la FEMA ne facture jamais de frais.", "Méfiez-vous des escroqueries et des entrepreneurs sans licence."],
      zh: ["县内非紧急问题（如残骸、道路危险）请拨打311。", "仅通过 DisasterAssistance.gov 或拨打1-800-621-3362申请联邦援助——FEMA从不收取申请费。", "谨防诈骗和无证承包商。"],
    },
    source: { name: "FEMA", url: "https://www.fema.gov/assistance/individual" },
  },
];
