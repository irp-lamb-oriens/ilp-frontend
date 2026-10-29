import FeedbackView from "@/components/lawyer/FeedbackView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerFeedbackPage() {
  return (
    <>
      <LawyerIntro screen="feedback" />
      <FeedbackView />
    </>
  );
}
