import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_TITLE } from "@/components/legal/content/terms";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/terms");

export default function TermsPage() {
  return (
    <LegalPage
      title={TERMS_TITLE}
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.terms}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      current="/terms"
    />
  );
}
