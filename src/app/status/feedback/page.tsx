import MonthlyFeedback from "@/components/status/MonthlyFeedback";
import MemberIntro from "@/components/status/MemberIntro";

export default function FeedbackPage() {
  return (
    <>
      <MemberIntro
        screen="feedback"
        title="Monthly check-in"
        what="One question we ask once a month: how likely you are to recommend ILP to a friend living abroad."
        how={[
          "Pick a number from 0 to 10.",
          "Add the main reason for your answer, if you like.",
          "Your answer is saved, and your team reads every one.",
        ]}
        why="Your answers show your team what is working for you and what to improve."
        tutorialId="client.feedback"
      />
      <MonthlyFeedback />
    </>
  );
}
