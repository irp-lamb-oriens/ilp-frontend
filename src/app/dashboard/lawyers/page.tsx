import LawyersView from "@/components/dashboard/views/LawyersView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function LawyersPage() {
  return (
    <StaffScreen intro="lawyers">
      <LawyersView />
    </StaffScreen>
  );
}
