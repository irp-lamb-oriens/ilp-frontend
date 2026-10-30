import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { COOKIES_INTRO, COOKIES_SECTIONS } from "@/components/legal/content/other";
import MeasurementChoice from "@/components/legal/MeasurementChoice";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/legal/cookies");

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie and storage notice"
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.cookies}
      intro={COOKIES_INTRO}
      sections={COOKIES_SECTIONS}
      current="/legal/cookies"
    >
      <MeasurementChoice />
    </LegalPage>
  );
}
