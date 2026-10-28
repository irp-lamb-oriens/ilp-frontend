import AvailabilityView from "@/components/lawyer/AvailabilityView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerAvailabilityPage() {
  return <AvailabilityView intro={<LawyerIntro screen="availability" flush />} />;
}
