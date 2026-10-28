import MemberOnly from "@/components/status/MemberOnly";
import MessagesThread from "@/components/status/MessagesThread";
import MemberIntro from "@/components/status/MemberIntro";
import AiNotice from "@/components/legal/AiNotice";

export default function MessagesPage() {
  return (
    <MemberOnly feature="messages">
      <MemberIntro
        screen="messages"
        title="Messages"
        what="One conversation with your ILP team, the people who look after your membership and follow up after your calls."
        how={[
          "Write your message in the box at the bottom of the page.",
          "Press Send to my team. A person from your team answers here.",
          "For a quick general question, press Ask the AI assistant. Its replies are marked AI assistant.",
        ]}
        why="Everything you ask and agree stays in one place. The AI assistant is not your lawyer, and your team confirms anything legal."
        tutorialId="client.messages"
      />
      {/* P6: one-time AI assistant notice (consent record), until accepted. */}
      <AiNotice />
      <MessagesThread />
    </MemberOnly>
  );
}
