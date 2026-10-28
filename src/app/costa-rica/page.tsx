import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/costa-rica.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Costa Rica. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14510492/pexels-photo-14510492.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Costa Rica obligations, organized and on time.",
  sub: "DIMEX renewals, CCSS contributions, municipal property tax, company filings and the marchamo. The free check shows which of these dates may apply to you.",
  obligations: [
    { kicker: "Residency", title: "Renew before your DIMEX expires", body: "Renewal can usually be started up to about three months before the expiry date on your DIMEX. Temporary residents also show they still meet their category's income or investment condition." },
    { kicker: "Social security", title: "CCSS contributions on schedule", body: "Residents keep their Caja payments current each month, and every DIMEX renewal asks for proof. Falling behind can block the renewal." },
    { kicker: "Property", title: "Municipal property tax, quarter by quarter", body: "Property tax (bienes inmuebles) is 0.25% of the registered value, usually paid quarterly. The value is declared to the municipality at least every five years." },
    { kicker: "Corporate", title: "Your sociedad's yearly dates", body: "The corporation tax is due January 31 (the next business day on a weekend), the beneficial-owner declaration (RTBF) during April, and an inactive company files its informative return too." },
    { kicker: "Vehicle", title: "Marchamo by December 31", body: "Every registered vehicle pays the marchamo between early November and December 31, and needs a valid technical inspection (RTV), whose month follows the last digit of the plate." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Costa Rica, when you need one.",
    body: "Members book 20-minute video calls with a lawyer licensed by the Colegio de Abogados y Abogadas de Costa Rica, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    DIMEX: "Costa Rica's resident identification card for foreigners.",
    Caja: "Costa Rica's public health and social security system.",
    CCSS: "Costa Rica's public health and social security system.",
    "bienes inmuebles": "The property tax paid to your municipality each year.",
    RTBF: "The yearly declaration of who owns or controls a company, filed with the Central Bank in April.",
    marchamo: "The yearly vehicle circulation payment, due by December 31.",
    RTV: "The periodic vehicle technical inspection.",
  },
};

export default function CostaRicaPage() {
  return <CountryPage country="Costa Rica" countryCode="CR" story={story} variant="zigzag" />;
}
