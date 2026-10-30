import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { DISCLAIMER_SECTIONS } from "@/components/legal/content/other";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/legal/disclaimer");

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Legal information disclaimer"
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.disclaimer}
      sections={DISCLAIMER_SECTIONS}
      current="/legal/disclaimer"
    />
  );
}
