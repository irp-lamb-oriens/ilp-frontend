import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { LEGAL_UPDATED } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/legal");

export default function LegalIndexPage() {
  return (
    <LegalPage
      title="Legal documents"
      updated={LEGAL_UPDATED}
      intro="Every document below is a draft pending review by ILP's counsel. Each one shows its version id at the top."
      sections={[
        {
          heading: "For everyone",
          body: ["How ILP handles information, what the website stores in your browser, and what our general information means."],
          links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Cookie and storage notice", href: "/legal/cookies" },
            { label: "Legal information disclaimer", href: "/legal/disclaimer" },
            { label: "Accessibility statement", href: "/legal/accessibility" },
          ],
        },
        {
          heading: "For members",
          body: ["What the membership includes, how billing and cancellation work, how calls are recorded and how AI is used."],
          links: [
            { label: "Terms of Membership", href: "/terms" },
            { label: "Call recording and AI notice", href: "/legal/recording" },
            { label: "Service providers (sub-processors)", href: "/legal/subprocessors" },
            { label: "Your data and privacy", href: "/status/privacy" },
          ],
        },
      ]}
      current="/legal"
    />
  );
}
