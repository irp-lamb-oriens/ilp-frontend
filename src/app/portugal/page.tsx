import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import CountryPage, { type CountryStory } from "@/components/CountryPage";

export const metadata: Metadata = pageMetadata("/portugal", { ownOgImage: true });

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

/** Content from docs/research/portugal.md (research date 2026-10-27). Each date may require review by a lawyer licensed in Portugal. */
const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/8432700/pexels-photo-8432700.jpeg",
  heroAlt: "People reviewing documents together",
  headline: "Portugal obligations, organized and on time.",
  sub: "AIMA renewals, IRS and IMI, the IFICI window, company filings and domestic staff: the dates people living in Portugal, or owning property there, keep track of.",
  obligations: [
    { kicker: "Residency", title: "Renew with AIMA 90 to 30 days ahead", body: "Temporary permits such as the D7 and D8 are renewed online with AIMA from 90 to 30 days before the card expires. After expiry, the right of residence lasts up to six months." },
    { kicker: "Citizenship", title: "Ten years under the 2026 law", body: "Since May 19, 2026, US and Canadian nationals usually need 10 years of legal residence for citizenship, counted from the date the first permit was issued." },
    { kicker: "Tax", title: "IRS from April 1 to June 30", body: "Tax residents file the IRS return between April 1 and June 30 and pay by August 31, including foreign income and accounts. New residents apply for IFICI by January 15 of the year after they arrive." },
    { kicker: "Property", title: "IMI by amount, and AIMI above EUR 600,000", body: "IMI is paid in May, or May and November, or May, August and November, depending on the amount. Holdings above EUR 600,000 in taxable value also pay AIMI by September 30." },
    { kicker: "Corporate", title: "Your Lda.'s yearly dates", body: "The company tax return (Modelo 22) is due by May 31, the IES by July 15, and the beneficial-owner confirmation (RCBE) by December 31. A certified accountant keeps the books." },
  ],
  band: {
    image: IMG(3184418),
    alt: "A clean, modern workspace",
    eyebrow: "Your lawyer",
    title: "A lawyer licensed in Portugal, when you need one.",
    body: "Members book 20-minute video calls with a lawyer registered with the Ordem dos Advogados, up to three a month. Your customer success manager (CSM) follows up on the next steps.",
  },
  glossary: {
    AIMA: "Portugal's immigration agency, which replaced SEF in 2023.",
    IRS: "Portugal's personal income tax.",
    IFICI: "The 20% tax regime that replaced NHR for some new residents.",
    IMI: "The yearly municipal property tax.",
    AIMI: "An extra yearly tax on high-value residential holdings.",
    IES: "The yearly company accounts filing.",
    RCBE: "The register of the people who own or control a company.",
    "Lda.": "Sociedade por quotas, Portugal's private limited company.",
  },
};

export default function PortugalPage() {
  return <CountryPage country="Portugal" countryCode="PT" story={story} variant="zigzag" />;
}
