import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import CountryPage, { type CountryStory } from "@/components/CountryPage";

export const metadata: Metadata = pageMetadata("/panama", { ownOgImage: true });

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/panama.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Panama. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14465475/pexels-photo-14465475.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents together",
  headline: "Panama obligations, organized and on time.",
  sub: "Residency cards, the tasa única, resident agent records, property tax installments and the décimo for staff: the dates people living in Panama, or holding assets there, keep track of.",
  obligations: [
    { kicker: "Residency", title: "Provisional cards and the switch to permanent", body: "Provisional residency cards expire on a printed date. Friendly Nations residents apply for permanent residency before the two-year provisional period ends." },
    { kicker: "Corporate", title: "Tasa única each year", body: "Every sociedad anónima (US$300) and private interest foundation (US$400) pays the tasa única: July 15 if it was registered January to June, January 15 if July to December." },
    { kicker: "Corporate", title: "Records with your resident agent", body: "Companies and foundations keep a resident agent and give it their accounting records, or a sworn statement, each year. Ownership changes are reported to the agent within 15 business days." },
    { kicker: "Property", title: "Property tax in three installments", body: "Property tax is paid by April 30, August 31 and December 31, with a discount for paying early. A registered primary home (Vivienda Principal) can pay less or none." },
    { kicker: "Staff", title: "Décimo tercer mes", body: "Employers, including households with staff, pay the thirteenth-month salary in three parts: April 15, August 15 and December 15." },
  ],
  band: {
    image: IMG(3184296),
    alt: "A tidy desk with a laptop and papers",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Panama, when you need one.",
    body: "Members book 20-minute video calls with a lawyer who holds an idoneidad from the Corte Suprema de Justicia, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    "tasa única": "The yearly fee every Panamanian company or foundation pays.",
    "resident agent": "The Panamanian lawyer or firm every company or foundation must appoint; it keeps the owner and accounting records.",
    "Friendly Nations": "Residency for citizens of listed countries, including the US and Canada: two years provisional, then permanent.",
    "Vivienda Principal": "Registered primary-home status that lowers or removes property tax.",
    "décimo tercer mes": "The thirteenth-month pay, in three installments.",
    idoneidad: "The licence to practise law, granted by the Supreme Court.",
  },
};

export default function PanamaPage() {
  return <CountryPage country="Panama" countryCode="PA" story={story} variant="pinned" />;
}
