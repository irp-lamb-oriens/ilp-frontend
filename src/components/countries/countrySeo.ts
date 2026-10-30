/**
 * Country page search content (SEO workstream, 2026-10-29): a plain intro and
 * a visible FAQ per country. The same arrays render on the page and feed the
 * FAQPage structured data, so the two can never differ.
 *
 * Every fact comes from docs/research/<country>.md (research date
 * 2026-10-27). Items the research marks as low or medium confidence say
 * "may", "usually" or "reported". Nothing here is legal advice; each answer
 * points to a lawyer licensed in the country. Dates that expire within weeks
 * (for example Colombia's resident visa traspaso deadline) stay out of this
 * file so the page does not go stale.
 */
import type { CountryCode } from "@/lib/contracts";

export interface CountryQa {
  q: string;
  a: string;
}

export interface CountrySeo {
  code: CountryCode;
  name: string;
  path: string;
  intro: string[];
  faq: CountryQa[];
}

export const COUNTRY_SEO: Record<CountryCode, CountrySeo> = {
  CR: {
    code: "CR",
    name: "Costa Rica",
    path: "/costa-rica",
    intro: [
      "Foreign residents and owners in Costa Rica deal with the same dates every year: the DIMEX renewal window, monthly CCSS (Caja) payments, municipal property tax, the corporation tax on January 31 and the marchamo by December 31.",
      "The free deadline check asks about your residency, property, companies and vehicles, then lists which of these may apply to you, with dates. Members ask a lawyer licensed by the Colegio de Abogados y Abogadas de Costa Rica to confirm what applies.",
    ],
    faq: [
      {
        q: "When can I renew my DIMEX in Costa Rica?",
        a: "Renewal can usually be started up to about three months before the expiry date printed on your DIMEX. Temporary residents also show they still meet their category's income or investment condition, and every renewal asks for proof that your CCSS payments are current. From February 16, 2026 to February 16, 2027 a temporary DGME resolution reduces the documents needed. A lawyer licensed in Costa Rica can confirm what your renewal needs.",
      },
      {
        q: "What happens if my DIMEX has already expired?",
        a: "There is a limited window after expiry in which a renewal can still be filed, and sources differ on its length (three or six months). After it, some categories may lose their status. Treat an expired DIMEX as urgent and ask a lawyer licensed in Costa Rica.",
      },
      {
        q: "When is the marchamo due?",
        a: "Every registered vehicle pays the marchamo between early November and December 31 for the next year. The vehicle also needs a valid technical inspection (RTV), and the inspection month follows the last digit of the plate: 1 is January, 9 is September and 0 is October.",
      },
      {
        q: "What does a Costa Rica corporation owe each year?",
        a: "The corporation tax is due January 31, or the next business day when that falls on a weekend. The beneficial ownership declaration (RTBF) is filed during April, by April 30. An inactive company may also have to file an informative return (Form 272), reported as due April 30.",
      },
      {
        q: "How is property tax paid in Costa Rica?",
        a: "Municipal property tax (bienes inmuebles) is 0.25% of the registered value a year, usually paid quarterly, and each municipality sets its own schedule. The value is declared to the municipality at least every five years. Homes above the luxury home threshold (143 million colones for 2026) may also owe the solidarity tax, filed and paid by January 15.",
      },
    ],
  },
  MX: {
    code: "MX",
    name: "Mexico",
    path: "/mexico",
    intro: [
      "In Mexico the recurring dates come from INM for residency, from SAT for taxes and from your municipality and state for predial and vehicle fees. Property in the restricted zone held through a bank trust (fideicomiso) adds its own yearly fee.",
      "The free deadline check lists the Mexico dates that may apply to you, from the resident card window to predial discounts. Members confirm them on a call with a lawyer who holds a Mexican cédula profesional.",
    ],
    faq: [
      {
        q: "When do I renew a temporary resident card in Mexico?",
        a: "In the 30 calendar days before the card expires. Temporary residency runs for at most four years in total, after which a change to permanent residency is usually needed.",
      },
      {
        q: "I entered Mexico with a residency visa from a consulate. What is next?",
        a: "Exchange the visa for a resident card at INM within 30 calendar days of entering Mexico.",
      },
      {
        q: "Do I have to tell INM when I move?",
        a: "Yes. A change of address, civil status, nationality or workplace is notified to INM within 90 days (Ley de Migración, article 63), and missing it can lead to a fine.",
      },
      {
        q: "When is predial paid in Mexico?",
        a: "Predial is an annual municipal property tax. Many municipalities discount early payment in January and February; in Mexico City the 2026 discounts for paying the year were 8% in January and 5% in February.",
      },
      {
        q: "What does a fideicomiso need each year?",
        a: "Property held through a bank trust in the restricted zone pays the bank an annual trustee fee. The trust term is up to 50 years and can be extended, and the substitute beneficiaries named in the trust should be kept up to date.",
      },
      {
        q: "What happens to my foreign-plated car?",
        a: "A car on a Banjercito temporary import permit (TIP) must leave Mexico and have the permit cancelled before its maximum return date. That includes when the permit holder becomes a permanent resident.",
      },
    ],
  },
  PA: {
    code: "PA",
    name: "Panama",
    path: "/panama",
    intro: [
      "Panama's recurring dates fall on residency cards, on companies and foundations (the yearly tasa única and the records kept with your resident agent) and on property tax paid in three installments.",
      "The free deadline check lists the Panama dates that may apply to you. Members confirm them on a call with a lawyer licensed in Panama.",
    ],
    faq: [
      {
        q: "When is the tasa única due in Panama?",
        a: "Each corporation or foundation pays the annual franchise tax (tasa única) by July 15 if it was registered from January to June, or by January 15 if it was registered from July to December.",
      },
      {
        q: "What does my resident agent need each year?",
        a: "Companies and foundations that do not operate in Panama, or only hold assets, give their resident agent financial statements, a financial summary, an asset-holding affidavit or a no-activity sworn statement every year (Executive Decree 177 of 2024). The research lists April 30 as the date; confirm it with your resident agent or a lawyer.",
      },
      {
        q: "When is property tax paid in Panama?",
        a: "Property tax is paid in three installments: April 30, August 31 and December 31. Paying the year early, by April 30, can earn a discount. Registering your primary home (Vivienda Principal or Patrimonio Familiar) can change the tax, and it is not retroactive.",
      },
      {
        q: "How does Friendly Nations residency become permanent?",
        a: "It starts with a two-year provisional permit, and the application for permanent residency is made before the provisional period ends. Your provisional card's expiry date is the one to watch.",
      },
      {
        q: "What changed for Qualified Investor residency in 2026?",
        a: "Executive Decree 17 of 2026 raised the investment amounts for new applicants and added an annual filing with MICI within the 30 calendar days before each anniversary of the immigration resolution. This comes from secondary sources, so ask a lawyer licensed in Panama how it applies to you.",
      },
      {
        q: "When is the thirteenth-month pay due for staff?",
        a: "Employers pay the décimo tercer mes in three parts: April 15, August 15 and December 15.",
      },
    ],
  },
  CO: {
    code: "CO",
    name: "Colombia",
    path: "/colombia",
    intro: [
      "In Colombia the dates that matter most for foreigners come from the visa (registration, renewal and the cédula de extranjería), from DIAN for taxes, from your municipality for predial and from the chamber of commerce for companies.",
      "The free deadline check lists the Colombia dates that may apply to you. Members confirm them on a call with a lawyer licensed in Colombia.",
    ],
    faq: [
      {
        q: "When do I register my visa and get a cédula de extranjería?",
        a: "Within 15 calendar days of entering Colombia on a new visa, or of the visa being issued if it was granted in Colombia. The cédula de extranjería is renewed after each new visa.",
      },
      {
        q: "When should I renew my Colombian visa?",
        a: "Apply for the next visa before the current one expires; the Cancillería advises starting one to two months ahead. An M visa lapses after more than 180 continuous days outside Colombia in any 365-day period, and an R visa after more than two continuous years outside.",
      },
      {
        q: "Do I file a tax return in Colombia?",
        a: "The 183-day test decides tax residency. In 2026 individuals filed between August 12 and October 26, by the last two digits of the NIT. A resident whose foreign assets were above 2,000 UVT on January 1 (COP 104,748,000 in 2026) may also file a foreign assets declaration.",
      },
      {
        q: "I bought property with money from abroad. Is there anything to register?",
        a: "A purchase paid from abroad is registered as foreign investment with Banco de la República, and the registration is cancelled or substituted when you sell. Since Decreto 1044 of 2026 those later registrations can be made at any time.",
      },
      {
        q: "When is predial due in Colombia?",
        a: "Each municipality sets its own calendar. In Bogotá in 2026, paying by April 17 earned a 10% discount and the final deadline was July 10. Medellín bills quarterly.",
      },
      {
        q: "What does a Colombian company renew each year?",
        a: "The commercial registration (matrícula mercantil) is renewed with the chamber of commerce by March 31.",
      },
    ],
  },
  PT: {
    code: "PT",
    name: "Portugal",
    path: "/portugal",
    intro: [
      "In Portugal the recurring dates come from AIMA for residence permits, from the tax authority (AT) for IRS, IMI and IUC, and from the 2026 nationality law for anyone counting the years to citizenship.",
      "The free deadline check lists the Portugal dates that may apply to you. Members confirm them on a call with a lawyer registered with the Ordem dos Advogados.",
    ],
    faq: [
      {
        q: "When do I renew a D7 or D8 residence permit with AIMA?",
        a: "File the renewal online with AIMA from 90 days and no later than 30 days before your card expires. These permits are usually issued for two years and then renewed for three. After expiry the right of residence lasts up to six months; past that, a new application at an AIMA counter is needed.",
      },
      {
        q: "How many years until I can apply for Portuguese citizenship?",
        a: "Under Lei Orgânica 1/2026, in force since May 19, 2026, US and Canadian citizens need 10 years of legal residence, counted from the issue of the residence permit. Applications pending on May 19, 2026 stay under the old rules.",
      },
      {
        q: "When is the IRS return filed in Portugal?",
        a: "Residents file from April 1 to June 30, and payment is due by August 31. New residents who qualify for IFICI register by January 15 of the year after becoming resident.",
      },
      {
        q: "When is IMI paid?",
        a: "Owners on December 31 pay IMI the following year: under 100 euros in one payment by May 31, from 100 to 500 euros in May and November, and over 500 euros in May, August and November.",
      },
      {
        q: "When is the vehicle tax (IUC) paid?",
        a: "In 2026 IUC is paid by the end of the vehicle's registration month. Under Decree-Law 161/2026 it moves to October in 2027 (July and October above 500 euros), then to April, July and October tiers from 2028.",
      },
    ],
  },
  ES: {
    code: "ES",
    name: "Spain",
    path: "/spain",
    intro: [
      "In Spain the recurring dates come from the residence permit and the TIE card, from the tax agency (IRPF, Modelo 720 and the non-resident return) and from your town hall for IBI and vehicle tax.",
      "The free deadline check lists the Spain dates that may apply to you. Members confirm them on a call with a lawyer registered with a Spanish bar association (colegio de abogados).",
    ],
    faq: [
      {
        q: "When do I renew a non-lucrative residence permit in Spain?",
        a: "The first permit lasts one year and renewals last two (Real Decreto 1155/2024). Renewal can be filed in the two months before expiry or up to three months after, though filing late may open a sanction procedure. After each grant or renewal, apply for the TIE card within one month.",
      },
      {
        q: "Can I keep driving on my US or Canadian licence in Spain?",
        a: "For at most six months after you become a normal resident. US and Canadian licences cannot be exchanged in Spain, so after that you need a Spanish licence, with theory and practical tests.",
      },
      {
        q: "Who files Modelo 720?",
        a: "Spanish tax residents with assets abroad above 50,000 euros file it between January 1 and March 31. The special fines were removed in 2022, but the duty to file remains. Crypto held abroad above 50,000 euros goes on Modelo 721 by the same date.",
      },
      {
        q: "I own a home in Spain but do not live there. What do I file?",
        a: "A non-resident owner of a home that is not rented files Modelo 210 for imputed income. Income for 2025 is due by December 31, 2026; from 2026 income onward the window is April 1 to December 31 of the following year (Orden HAC/623/2026). IBI, the municipal property tax, is paid in the window your town hall sets.",
      },
      {
        q: "When is the IRPF income tax return filed?",
        a: "Spanish tax residents file IRPF in the spring campaign, which ran from April 8 to June 30 in 2026.",
      },
      {
        q: "I have a Spanish golden visa. What happens now?",
        a: "Spain ended investor (golden) visas from April 3, 2025. How existing holders renew was not confirmed in our research, so ask a lawyer licensed in Spain before your permit expires.",
      },
    ],
  },
};

/** Order of the "other countries" links. */
export const COUNTRY_ORDER: CountryCode[] = ["CO", "CR", "MX", "PA", "PT", "ES"];
