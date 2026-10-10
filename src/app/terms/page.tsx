import LegalPage from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service & Membership Rules"
      updated="October 2026"
      sections={[
        {
          heading: "Platform scope",
          body: [
            "International Legal Partner (ILP) is a legal-technology platform that connects members with vetted local legal professionals and organizes their legal obligations. ILP is not a law firm and does not provide legal advice.",
          ],
        },
        {
          heading: "Membership",
          body: [
            "Membership is $79.99 per month plus a one-time $100 activation fee. It includes up to 60 minutes of consultation time per month, structured as up to 3 consultations of 20 minutes each.",
            "Unused consultation minutes do not roll over to subsequent months.",
          ],
        },
        {
          heading: "Consultations",
          body: [
            "Membership consultations cover technical explanations of current laws, procedures, requirements, options, and next steps, and issue identification.",
            "Formal individualized legal work, including due diligence, contract drafting, property closings, formal legal opinions, court filings, and litigation, is scoped, quoted, and paid separately.",
          ],
        },
        {
          heading: "No guaranteed outcomes",
          body: [
            "ILP does not guarantee any particular legal outcome. Legal judgment is provided solely by the independent legal professionals you engage.",
          ],
        },
        {
          heading: "Disclaimers",
          body: [
            "Information on the platform is provided for general informational purposes and is not a substitute for professional legal advice specific to your situation.",
          ],
        },
      ]}
    />
  );
}