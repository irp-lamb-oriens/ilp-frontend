import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/colombia.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Colombia. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/19655623/pexels-photo-19655623.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Colombia obligations, organized and on time.",
  sub: "Visa registration and the cédula de extranjería, the resident visa traspaso, DIAN returns, predial and company renewals: the dates people living in Colombia, or owning property there, keep track of.",
  obligations: [
    { kicker: "Residency", title: "Older resident visas: traspaso by October 31, 2026", body: "Resident visas granted under the rules before October 2022 must be transferred (traspaso) before October 31, 2026, and the Cancillería treats it as required to issue the cédula de extranjería. If you hold one, this may require review right away." },
    { kicker: "Residency", title: "Register your visa within 15 days", body: "A visa longer than three months is registered with Migración Colombia, and the cédula de extranjería requested, within 15 calendar days of arriving or of the visa being issued. A new visa means a new cédula." },
    { kicker: "Tax", title: "DIAN returns from August to October", body: "Tax residents (more than 183 days in a year) file between August and October, on a day set by the last two digits of their NIT. Foreign assets over 2,000 UVT are declared with the return." },
    { kicker: "Property", title: "Predial and a purchase paid from abroad", body: "Bogotá and Medellín set their own predial calendars, with early-payment discounts. A purchase paid with money from abroad is registered as foreign investment with the Banco de la República." },
    { kicker: "Corporate", title: "Matrícula mercantil by March 31", body: "Every company renews its commercial registration with the Cámara de Comercio by March 31 and keeps its beneficial owners up to date in the RUB." },
    { kicker: "Staff", title: "PILA, prima and cesantías", body: "If someone works for you, social security goes through PILA each month, the prima is paid by June 30 and December 20, and cesantías go to the fund by February 14." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Colombia, when you need one.",
    body: "Members book 20-minute video calls with a lawyer who holds a tarjeta profesional, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    "cédula de extranjería": "Colombia's ID card for foreign visa holders aged 7 and up.",
    traspaso: "Moving a visa to a new passport or to the current format; older resident visas need one by October 31, 2026.",
    "Migración Colombia": "The immigration authority for entry, exit, the cédula de extranjería and reporting.",
    DIAN: "Colombia's national tax and customs authority.",
    NIT: "Your tax ID number; for most foreigners it is the cédula de extranjería number.",
    UVT: "The tax unit Colombia uses for thresholds and fines (COP 52,374 in 2026).",
    predial: "The yearly property tax paid to your municipality.",
    "matrícula mercantil": "A company's commercial registration, renewed by March 31.",
    RUB: "DIAN's register of the people who own or control a company.",
    PILA: "The monthly form used to pay social security for an employee.",
    cesantías: "Severance savings, one month's pay a year, deposited in a fund by February 14.",
  },
};

export default function ColombiaPage() {
  return <CountryPage country="Colombia" countryCode="CO" story={story} variant="zigzag" />;
}
