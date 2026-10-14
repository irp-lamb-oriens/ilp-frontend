import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3184292),
  heroAlt: "People reviewing documents together",
  headline: "Spain obligations, organized and on time.",
  sub: "TIE and NIE renewals, modelo tax filings, padrón registration, and autónomo duties, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew your TIE on schedule", body: "The Tarjeta de Identidad de Extranjero expires on fixed cycles. Miss the window and you may restart the process." },
    { kicker: "Tax", title: "Modelo filings and the AEAT", body: "Residents and entities must stay current with the Agencia Tributaria. Arrears can block renewals and other filings." },
    { kicker: "Property", title: "IBI, year by year", body: "The Impuesto sobre Bienes Inmuebles is assessed locally. We track your municipality and its cadastral values." },
    { kicker: "Corporate", title: "Autónomo and mercantile duties", body: "Self-employment contributions, quarterly models, and company registry filings each carry their own date." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Spanish professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in Madrid.",
  },
};

export default function SpainPage() {
  return <CountryPage country="Spain" countryCode="ES" story={story} variant="zigzag" />;
}