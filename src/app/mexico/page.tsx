import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/mexico.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Mexico. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/7772191/pexels-photo-7772191.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Mexico obligations, organized and on time.",
  sub: "INM cards and renewals, SAT filings, predial, the fideicomiso fee and staff bonuses: the dates people living in Mexico, or owning property there, keep track of.",
  obligations: [
    { kicker: "Residency", title: "Exchange your visa for a card within 30 days", body: "After entering with a residency visa from a consulate, you usually exchange it for the resident card at INM within 30 calendar days. Temporary cards are renewed in the 30 days before they expire, for up to four years in total." },
    { kicker: "Residency", title: "Tell INM about changes within 90 days", body: "A new address, job, marital status or nationality is reported to INM within 90 days. Missing it can bring a fine." },
    { kicker: "Tax", title: "SAT returns", body: "If you rent out property, monthly payments are due by the 17th of the following month and the yearly return in April. Companies file their yearly return by March 31." },
    { kicker: "Property", title: "Predial and your fideicomiso", body: "Most cities give a discount for paying the year's predial in January. Property in the restricted zone near coasts and borders is held through a bank trust (fideicomiso) with a yearly fee and a 50-year term." },
    { kicker: "Staff", title: "Aguinaldo before December 20", body: "Employers, including households with a domestic worker, pay at least 15 days' salary as aguinaldo before December 20, and register domestic workers with the IMSS." },
  ],
  band: {
    image: IMG(3183197),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Mexico, when you need one.",
    body: "Members book 20-minute video calls with a lawyer who holds a cédula profesional, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    INM: "Mexico's immigration authority.",
    SAT: "Mexico's federal tax authority.",
    RFC: "Your Mexican tax ID.",
    predial: "The yearly property tax paid to your municipality.",
    fideicomiso: "A bank trust that holds title for a foreign owner in the restricted zone.",
    aguinaldo: "The year-end bonus owed to employees before December 20.",
    IMSS: "Mexico's social security institute.",
  },
};

export default function MexicoPage() {
  return <CountryPage country="Mexico" countryCode="MX" story={story} variant="zigzag" />;
}
