import PrivacyCenter from "@/components/legal/PrivacyCenter";
import MemberIntro from "@/components/status/MemberIntro";

/** Member data rights (P6): download, consents, correction, objection, deletion. */
export default function MemberPrivacyPage() {
  return (
    <>
      {/* PrivacyCenter (components/legal, shared) renders the page h1, so this intro uses an h2. */}
      <MemberIntro
        screen="privacy"
        headingLevel={2}
        title="How this page works"
        what="Everything ILP keeps about you, and the choices you have made about how it is used."
        how={[
          "Download a copy of your data.",
          "Change your choices about call recording, news and offers by email, and the AI assistant.",
          "Ask us to correct your data, stop a use of it, or delete your account.",
        ]}
        why="Your legal information is personal. You can see it any time and decide how it is used."
        tutorialId="client.privacy"
      />
      <PrivacyCenter />
    </>
  );
}
