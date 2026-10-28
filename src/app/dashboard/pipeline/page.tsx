import PipelineView from "@/components/dashboard/views/PipelineView";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function PipelinePage() {
  return (
    <StaffScreen intro="pipeline">
      <PipelineView />
    </StaffScreen>
  );
}
