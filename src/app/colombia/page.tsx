import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/19655623/pexels-photo-19655623.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Colombia obligations, organized and on time.",
  sub: "Cédula de extranjería renewals, DIAN tax filings, RUT updates, property tax, and corporate duties, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew your cédula de extranjería", body: "Foreign resident cards expire on a set schedule. If you miss the window, you may have to start over. We file the renewal before it's due." },
    { kicker: "Tax", title: "DIAN filings and RUT updates", body: "Residents and businesses must stay current with DIAN. Fall behind and renewals and other filings can be blocked. We watch every date." },
    { kicker: "Property", title: "Predial property tax, year by year", body: "Property tax is set by your local area. We watch your town and the value it reports." },
    { kicker: "Corporate", title: "Cámara de Comercio renewals", body: "Your company's yearly registration and bookkeeping duties each have their own due date. We keep them on your calendar." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Colombian professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in Bogotá.",
  },
  glossary: {
    "cédula de extranjería": "Colombia's identification card for foreign residents.",
    DIAN: "Colombia's tax authority, which you file your returns with.",
    RUT: "Colombia's tax registration number, which you must keep current with DIAN.",
    predial: "The yearly property tax paid to your local government in Colombia.",
    "Cámara de Comercio": "The Chamber of Commerce where your company registers each year in Colombia.",
  },
};

export default function ColombiaPage() {
  return <CountryPage country="Colombia" countryCode="CO" story={story} variant="zigzag" />;
}