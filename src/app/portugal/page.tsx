import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/8432700/pexels-photo-8432700.jpeg",
  heroAlt: "People reviewing documents together",
  headline: "Portugal obligations, organized and on time.",
  sub: "Residence permit renewals, IRS tax filings, NIF registration and NHR duties: the dates people living in Portugal keep track of.",
  obligations: [
    { kicker: "Residency", title: "Renew your residence permit on schedule", body: "Temporary and permanent permits expire on a set schedule. If you miss the window, you may have to start over." },
    { kicker: "Tax", title: "IRS filings and the AT", body: "Residents and businesses must stay current with the Autoridade Tributária. Fall behind and renewals and other filings can be blocked." },
    { kicker: "Property", title: "IMI, year by year", body: "The IMI is set by your local area." },
    { kicker: "Corporate", title: "Company and Segurança Social duties", body: "Yearly accounts, social security payments, and registry filings each have their own due date." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Not open yet",
    title: "ILP is not open in Portugal yet.",
    body: "ILP is open in Costa Rica now. Portugal is not available yet.",
  },
  glossary: {
    NIF: "Portugal's tax registration number for individuals and companies.",
    NHR: "The tax scheme that offered new residents a lower flat rate for ten years.",
    "Autoridade Tributária": "Portugal's tax authority, which you file your returns with.",
    IRS: "Portugal's personal income tax, filed each year.",
    IMI: "The yearly property tax paid to your local town in Portugal.",
    "Segurança Social": "Portugal's social security system, which collects monthly payments.",
  },
};

export default function PortugalPage() {
  return <CountryPage country="Portugal" countryCode="PT" story={story} variant="zigzag" />;
}