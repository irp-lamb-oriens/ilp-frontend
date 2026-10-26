import { AdminOnly } from "@/components/dashboard/staff/StaffSession";
import SettingsView from "@/components/dashboard/views/SettingsView";

export default function SettingsPage() {
  return (
    <AdminOnly>
      <SettingsView />
    </AdminOnly>
  );
}
