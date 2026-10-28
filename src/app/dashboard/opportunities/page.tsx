import OpportunitiesView from "@/components/dashboard/opportunities/OpportunitiesView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function OpportunitiesPage() {
  return (
    <StaffScreen intro="opportunities">
      <OpportunitiesView />
    </StaffScreen>
  );
}
