import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import LegalPage from "@/components/LegalPage";
import { SUBPROCESSORS_INTRO, SUBPROCESSORS_SECTIONS } from "@/components/legal/content/other";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = pageMetadata("/legal/subprocessors");

export default function SubprocessorsPage() {
  return (
    <LegalPage
      title="Service providers (sub-processors)"
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.subprocessors}
      intro={SUBPROCESSORS_INTRO}
      sections={SUBPROCESSORS_SECTIONS}
      current="/legal/subprocessors"
    />
  );
}
