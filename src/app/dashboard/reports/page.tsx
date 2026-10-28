import ReportsView from "@/components/dashboard/views/ReportsView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function ReportsPage() {
  return (
    <StaffScreen intro="reports">
      <ReportsView />
    </StaffScreen>
  );
}
