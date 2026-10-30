import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import CountryPage, { type CountryStory } from "@/components/CountryPage";

export const metadata: Metadata = pageMetadata("/spain", { ownOgImage: true });

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/spain.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Spain. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/10157047/pexels-photo-10157047.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Spain obligations, organized and on time.",
  sub: "Residence permit and TIE renewals, IRPF and Modelo 720, IBI, your driving licence and household staff: the dates people living in Spain, or owning property there, keep track of.",
  obligations: [
    { kicker: "Residency", title: "Renew your permit in the right window", body: "A non-lucrative permit can be renewed from 60 days before it expires until 90 days after, and renewals now last two years. After a grant or renewal, you apply for the TIE card within a month." },
    { kicker: "Driving", title: "Your US or Canadian licence has a limit", body: "Neither country has an exchange agreement with Spain. Once you are a resident, a US or Canadian licence is valid for at most six months, then you need a Spanish licence." },
    { kicker: "Tax", title: "IRPF and Modelo 720", body: "Tax residents file the IRPF from early April to June 30. If you hold more than EUR 50,000 abroad in accounts, investments or property, Modelo 720 is due by March 31." },
    { kicker: "Property", title: "IBI and the non-resident return", body: "The IBI is paid to your town hall in a period it sets. A non-resident owner files Modelo 210 each year, even for a home that is not rented out." },
    { kicker: "Corporate", title: "Your S.L.'s yearly dates", body: "Shareholders approve the accounts by June 30, the accounts are deposited by July 30, and the company tax return (Modelo 200) is filed in July. VAT returns are quarterly." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Spain, when you need one.",
    body: "Members book 20-minute video calls with a colegiado lawyer, a member of a Colegio de Abogados, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    TIE: "Spain's residence card for non-EU residents; it shows your NIE.",
    NIE: "Your permanent foreigner number for tax, property and paperwork.",
    IRPF: "Spain's personal income tax for residents.",
    "Modelo 720": "The yearly declaration of assets held outside Spain above EUR 50,000.",
    IBI: "The yearly property tax paid to your town hall.",
    "Modelo 210": "The non-resident tax return, including for a home that is not rented out.",
    "S.L.": "Sociedad Limitada, Spain's usual private limited company.",
  },
};

export default function SpainPage() {
  return <CountryPage country="Spain" countryCode="ES" story={story} variant="zigzag" />;
}
