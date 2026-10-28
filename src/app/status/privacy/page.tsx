import Link from "next/link";
import PrivacyCenter from "@/components/legal/PrivacyCenter";
import MemberIntro from "@/components/status/MemberIntro";

/** Member data rights (P6): download, consents, correction, objection, deletion. */
export default function MemberPrivacyPage() {
  return (
    <>
      {/* The intro is the page h1; PrivacyCenter drops its own header. */}
      <MemberIntro
        screen="privacy"
        title="Your data and privacy"
        what="Everything ILP keeps about you, and the choices you have made about how it is used."
        how={[
          "Download a copy of your data.",
          "Change your choices about call recording, news and offers by email, and the AI assistant.",
          "Ask us to correct your data, stop a use of it, or delete your account.",
        ]}
        why={
          <>
            Your legal information is personal. You can see it any time and decide how it is used. The{" "}
            <Link href="/privacy">Privacy Policy</Link> has the details.
          </>
        }
        tutorialId="client.privacy"
      />
      <PrivacyCenter header={false} />
    </>
  );
}
