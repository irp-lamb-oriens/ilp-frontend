import BookingFlow from "@/components/status/BookingFlow";
import MemberIntro from "@/components/status/MemberIntro";

export default function BookPage() {
  return (
    <>
      <MemberIntro
        screen="book"
        title="Book a call"
        what="Book a 20-minute video call with your lawyer, who is licensed in the country your membership covers. Calls are part of your membership."
        how={[
          "Write what you would like to ask.",
          "Pick a day and a time. Times are shown in your own time zone, from your profile.",
          "Say whether the call may be recorded.",
          "Press Book this call. The video link comes by email.",
        ]}
        why="Your lawyer reads your question and your profile before the call, so you get clear answers in the time you have."
        tutorialId="client.book"
      />
      <BookingFlow />
    </>
  );
}
