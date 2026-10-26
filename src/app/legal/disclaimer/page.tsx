import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { DISCLAIMER_SECTIONS } from "@/components/legal/content/other";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = { title: "Legal information disclaimer | ILP" };

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
