import { Suspense, type ReactNode } from "react";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";
import { JourneysChrome } from "@/components/dashboard/journeys/JourneysFrame";

/** Journeys: one intro, section links and the shared filters (kept in the URL) for every page. */
export default function JourneysLayout({ children }: { children: ReactNode }) {
  return (
    <StaffScreen intro="journeys">
      <Suspense fallback={null}>
        <JourneysChrome>{children}</JourneysChrome>
      </Suspense>
    </StaffScreen>
  );
}
