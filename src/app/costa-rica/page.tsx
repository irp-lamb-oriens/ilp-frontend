import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14510492/pexels-photo-14510492.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Costa Rica obligations, organized and on time.",
  sub: "Residency renewals, CCSS contributions, municipal property tax and company filings. The free check shows which of these dates may apply to you.",
  obligations: [
    { kicker: "Residency", title: "Renew before your DIMEX expires", body: "Your DIMEX card expires on a set schedule. If you miss the deadline, you may have to start your residency over. We remind you before it is due." },
    { kicker: "Social security", title: "CCSS contributions on schedule", body: "If you fall behind on payments, the Caja can cut your coverage and slow down renewals. We remind you of the dates so you stay in good standing." },
    { kicker: "Property", title: "Municipal property tax, quarter by quarter", body: "Property tax is set by your local area, and you must update your property's reported value every five years. We remind you before each payment and before the five-year update." },
    { kicker: "Corporate", title: "Your sociedad's annual obligations", body: "Corporate tax, the beneficial-owner registry, and bookkeeping each have a due date that comes with a fine if missed. We keep all three on your list of dates and remind you before they are due." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Costa Rica, when you need one.",
    body: "Members book 20-minute video calls with a lawyer licensed in Costa Rica, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    DIMEX: "Costa Rica's resident identification card for foreigners.",
    Caja: "Costa Rica's public health and social security system.",
    CCSS: "Costa Rica's public health and social security system.",
    "bienes inmuebles": "The property tax paid to your municipality each year.",
    "beneficial-owner registry": "The national record of the people who own or control a company.",
  },
};

export default function CostaRicaPage() {
  return <CountryPage country="Costa Rica" countryCode="CR" story={story} variant="zigzag" />;
}