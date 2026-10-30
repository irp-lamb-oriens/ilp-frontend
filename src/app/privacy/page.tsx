import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_TITLE } from "@/components/legal/content/privacy";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/privacy");

export default function PrivacyPage() {
  return (
    <LegalPage
      title={PRIVACY_TITLE}
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.privacy}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      current="/privacy"
    />
  );
}
