import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/10157047/pexels-photo-10157047.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Spain obligations, organized and on time.",
  sub: "TIE and NIE renewals, modelo tax filings, padrón registration, and autónomo duties, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Residency", title: "Renew your TIE on schedule", body: "The TIE expires on a set schedule. If you miss the window, you may have to start over. We file the renewal before it's due." },
    { kicker: "Tax", title: "Modelo filings and the AEAT", body: "Residents and businesses must stay current with the Agencia Tributaria. Fall behind and renewals and other filings can be blocked. We watch every date." },
    { kicker: "Property", title: "IBI, year by year", body: "The IBI is set by your local area. We watch your town and the property value it reports." },
    { kicker: "Corporate", title: "Autónomo and mercantile duties", body: "Self-employment payments, quarterly models, and registry filings each have their own due date. We keep them on your calendar." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Spanish professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices in Madrid.",
  },
  glossary: {
    TIE: "Spain's ID card showing you are a legal foreign resident.",
    modelo: "Spain's numbered tax return forms, each covering a different obligation.",
    IBI: "The yearly property tax paid to your local town hall in Spain.",
    AEAT: "Spain's tax authority, the Agencia Tributaria.",
    autónomo: "Spain's status for self-employed workers, with its own monthly payments.",
  },
};

export default function SpainPage() {
  return <CountryPage country="Spain" countryCode="ES" story={story} variant="zigzag" />;
}