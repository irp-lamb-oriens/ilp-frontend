import { AdminOnly } from "@/components/dashboard/staff/StaffSession";
import SettingsView from "@/components/dashboard/views/SettingsView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function SettingsPage() {
  return (
    <AdminOnly what="Settings">
      <StaffScreen intro="settings">
        <SettingsView />
      </StaffScreen>
    </AdminOnly>
  );
}
