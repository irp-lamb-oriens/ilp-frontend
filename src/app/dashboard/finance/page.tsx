import { AdminOnly } from "@/components/dashboard/staff/StaffSession";
import FinanceHome from "@/components/dashboard/views/FinanceHome";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function FinancePage() {
  return (
    <AdminOnly what="Finance">
      <StaffScreen intro="finance">
        <FinanceHome />
      </StaffScreen>
    </AdminOnly>
  );
}
