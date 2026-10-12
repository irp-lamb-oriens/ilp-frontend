import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3184292),
  heroAlt: "People reviewing documents together",
  headline: "Colombia obligations, organized and on time.",
  sub: "Cédula de extranjería renewals, DIAN tax filings, RUT updates, property tax, and corporate duties, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew your cédula de extranjería", body: "Foreign resident cards expire on fixed cycles. Miss the window and you may restart the process." },
    { kicker: "Tax", title: "DIAN filings and RUT updates", body: "Residents and entities must stay current with the tax authority. Arrears can block renewals and other filings." },
    { kicker: "Property", title: "Predial property tax, year by year", body: "Municipal property tax is assessed locally. We track your municipality and the valuation it requires." },
    { kicker: "Corporate", title: "Cámara de Comercio renewals", body: "Your company's annual registration and bookkeeping duties each have their own date." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Colombian professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in Bogotá.",
  },
};

export default function ColombiaPage() {
  return <CountryPage country="Colombia" countryCode="CO" story={story} variant="zigzag" />;
}