import TodayView from "@/components/dashboard/today/TodayView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function TodayPage() {
  return (
    <StaffScreen intro="today">
      <TodayView />
    </StaffScreen>
  );
}
