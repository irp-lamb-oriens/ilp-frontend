import { Suspense } from "react";
import MembersList from "@/components/dashboard/members/MembersList";
import { StaffScreen } from "@/components/dashboard/staff/ScreenIntro";

export default function MembersPage() {
  return (
    <StaffScreen intro="members">
      <Suspense fallback={null}>
        <MembersList />
      </Suspense>
    </StaffScreen>
  );
}
