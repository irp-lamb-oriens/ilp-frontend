import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14510492/pexels-photo-14510492.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Costa Rica obligations, organized and on time.",
  sub: "Residency renewals, CCSS contributions, municipal property tax, and corporate filings, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew before your DIMEX expires", body: "Your DIMEX card expires on a set schedule. If you miss the deadline, you may have to start your residency over. We file the renewal before it's due." },
    { kicker: "Social security", title: "CCSS contributions on schedule", body: "If you fall behind on payments, the Caja can cut your coverage and slow down renewals. We watch every payment so you stay in good standing." },
    { kicker: "Property", title: "Municipal property tax, quarter by quarter", body: "Property tax is set by your local area, and you must update your property's reported value every five years. We watch your town so a missed payment never turns into a debt on your home." },
    { kicker: "Corporate", title: "Your sociedad's annual obligations", body: "Corporate tax, the beneficial-owner registry, and bookkeeping each have a due date that comes with a fine if missed. We keep all three on your calendar and warn you before they're due." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Costa Rican professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in San José.",
  },
  glossary: {
    DIMEX: "Costa Rica's resident identification card for foreigners.",
    Caja: "Costa Rica's public health and social security system.",
    CCSS: "Costa Rica's public health and social security system.",
    "bienes inmuebles": "The property tax paid to your municipality each year.",
    "beneficial-owner registry": "The national record of who actually owns a company.",
  },
};

export default function CostaRicaPage() {
  return <CountryPage country="Costa Rica" countryCode="CR" story={story} variant="zigzag" />;
}