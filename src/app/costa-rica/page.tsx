import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3184292),
  heroAlt: "People reviewing documents together",
  headline: "Costa Rica obligations, organized and on time.",
  sub: "Residency renewals, CCSS contributions, municipal property tax, and corporate filings, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew before your DIMEX lapses", body: "Temporary and permanent residency cards expire on fixed cycles. Miss the window and you may restart the process." },
    { kicker: "Social security", title: "CCSS contributions on schedule", body: "Residents must stay current with the Caja. Arrears can block renewals and other filings." },
    { kicker: "Property", title: "Municipal property tax, quarter by quarter", body: "Bienes inmuebles is assessed locally. We track your municipality and the valuation declaration it requires." },
    { kicker: "Corporate", title: "Your sociedad's annual obligations", body: "Corporate tax, the beneficial-owner registry, and bookkeeping duties each have their own date." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Costa Rican professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in San José.",
  },
};

export default function CostaRicaPage() {
  return <CountryPage country="Costa Rica" countryCode="CR" story={story} variant="zigzag" />;
}