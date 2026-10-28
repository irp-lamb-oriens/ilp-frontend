import PrivacyAdmin from "@/components/legal/PrivacyAdmin";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function DashboardPrivacyPage() {
  return (
    <StaffScreen intro="privacy">
      <PrivacyAdmin />
    </StaffScreen>
  );
}
