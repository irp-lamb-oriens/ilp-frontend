import DeadlinesView from "@/components/status/DeadlinesView";
import MemberIntro from "@/components/status/MemberIntro";

export default function DeadlinesPage() {
  return (
    <>
      <MemberIntro
        screen="deadlines"
        title="Your deadlines"
        what="The legal dates and duties you chose, such as a residency renewal, a property tax or a vehicle permit. Each one may require review."
        how={[
          "Set a date for each deadline, or use the date we suggest from your answers.",
          "Mark a deadline done when it is handled, or turn its reminders off.",
          "Press Add more deadlines to include other dates that apply to you, and remove the ones that do not.",
        ]}
        why="We email you 30 and 7 days before each date, so you have time to act before a late fee or a lapsed status."
        tutorialId="client.deadlines"
      />
      <DeadlinesView />
    </>
  );
}
