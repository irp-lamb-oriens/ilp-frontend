import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3184292),
  heroAlt: "People reviewing documents together",
  headline: "Portugal obligations, organized and on time.",
  sub: "Residence permit renewals, IRS tax filings, NIF registration, and NHR duties, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew your residence permit on schedule", body: "Temporary and permanent residence permits expire on fixed cycles. Miss the window and you may restart the process." },
    { kicker: "Tax", title: "IRS filings and the AT", body: "Residents and entities must stay current with the Autoridade Tributária. Arrears can block renewals and other filings." },
    { kicker: "Property", title: "IMI, year by year", body: "The Imposto Municipal sobre Imóveis is assessed locally. We track your municipality and its cadastral values." },
    { kicker: "Corporate", title: "Company and Segurança Social duties", body: "Annual accounts, social security contributions, and registry filings each carry their own date." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Portuguese professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in Lisbon.",
  },
};

export default function PortugalPage() {
  return <CountryPage country="Portugal" countryCode="PT" story={story} variant="zigzag" />;
}