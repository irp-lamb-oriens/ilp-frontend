import { AdminOnly } from "@/components/dashboard/staff/StaffSession";
import FinanceHome from "@/components/dashboard/views/FinanceHome";

export default function FinancePage() {
  return (
    <AdminOnly>
      <FinanceHome />
    </AdminOnly>
  );
}
