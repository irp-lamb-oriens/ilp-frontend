import ProfileAndDocuments from "@/components/status/ProfileAndDocuments";
import MemberIntro from "@/components/status/MemberIntro";

export default function ProfilePage() {
  return (
    <>
      <MemberIntro
        screen="profile"
        title="Profile and documents"
        what="Your legal profile: the facts about you, your household, your residency, and any property, company or vehicle in the country your membership covers, plus that country's own questions. Your documents are kept at the bottom of the page."
        how={[
          "Fill in a section and press its Save button. You can do one section at a time.",
          "Upload documents such as your passport or residence card in Your documents.",
          "Come back when something changes, like a renewed residency card or a new car.",
        ]}
        why="Your lawyer reads this before every call, so your 20 minutes go to your question. At 70% complete, your lawyer has what they need to prepare."
        tutorialId="client.profile"
      />
      <ProfileAndDocuments />
    </>
  );
}
