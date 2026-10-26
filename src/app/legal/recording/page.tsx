import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { RECORDING_INTRO, RECORDING_SECTIONS } from "@/components/legal/content/other";
import { LEGAL_UPDATED, LEGAL_VERSIONS } from "@/components/legal/versions";

export const metadata: Metadata = { title: "Call recording and AI notice | ILP" };

export default function RecordingPage() {
  return (
    <LegalPage
      title="Call recording and AI notice"
      updated={LEGAL_UPDATED}
      version={LEGAL_VERSIONS.recording}
      intro={RECORDING_INTRO}
      sections={RECORDING_SECTIONS}
      current="/legal/recording"
    />
  );
}
