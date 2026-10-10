import LegalPage from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy & Recording Consent"
      updated="October 2026"
      sections={[
        {
          heading: "Data we collect",
          body: [
            "We collect the information you provide to build your legal profile: identity, family, residency, property, corporate, vehicle, and business details, plus documents you upload.",
          ],
        },
        {
          heading: "How we protect it",
          body: [
            "Data is encrypted in transit and at rest. Access is role-based: only the professionals and staff involved in your matters can see the information they need.",
          ],
        },
        {
          heading: "Call recording and transcription",
          body: [
            "Consultations may be recorded and transcribed to produce summaries and action items. Recording happens only with your consent, and you can decline without affecting your membership.",
          ],
        },
        {
          heading: "Document retention",
          body: [
            "Documents are retained for as long as your profile is active and for a reasonable period after, to support continuity of your legal record. You can request deletion of specific documents.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request access to, correction of, or deletion of your personal data at any time by contacting us.",
          ],
        },
      ]}
    />
  );
}