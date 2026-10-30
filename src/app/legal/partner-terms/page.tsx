import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { PARTNER_TERMS_INTRO, PARTNER_TERMS_SECTIONS, PARTNER_TERMS_VERSION } from "@/components/legal/content/partner";
import { LEGAL_UPDATED } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/legal/partner-terms");

export default function PartnerTermsPage() {
  return (
    <LegalPage
      title="Partner lawyer terms (draft)"
      updated={LEGAL_UPDATED}
      version={PARTNER_TERMS_VERSION}
      intro={PARTNER_TERMS_INTRO}
      sections={PARTNER_TERMS_SECTIONS}
      current="/legal/partner-terms"
    />
  );
}
