import CancelMembership from "@/components/status/CancelMembership";
import MemberIntro from "@/components/status/MemberIntro";

export default function CancelMembershipPage() {
  return (
    <>
      <MemberIntro
        screen="cancel"
        title="Cancel your membership"
        what="Here you can end your membership. It stops at the end of the month you have already paid for."
        how={[
          "Read what happens when you cancel.",
          "Tell us why you are leaving, if you like. It is optional.",
          "Press Cancel membership. A confirmation comes by email.",
          "Changed your mind? Press Keep my membership any time before the end date.",
        ]}
        why="You can leave without calling anyone, and your profile and documents stay in your account."
        tutorialId="client.cancel"
      />
      <CancelMembership />
    </>
  );
}
