import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { ACCESSIBILITY_SECTIONS } from "@/components/legal/content/other";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = { title: "Accessibility statement | ILP" };

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility statement"
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.accessibility}
      sections={ACCESSIBILITY_SECTIONS}
      current="/legal/accessibility"
    />
  );
}
