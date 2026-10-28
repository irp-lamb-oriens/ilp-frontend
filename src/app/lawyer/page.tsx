import LawyerIntro from "@/components/lawyer/LawyerIntro";
import TodayView from "@/components/lawyer/TodayView";

export default function LawyerTodayPage() {
  return (
    <>
      <LawyerIntro screen="today" />
      <TodayView />
    </>
  );
}
