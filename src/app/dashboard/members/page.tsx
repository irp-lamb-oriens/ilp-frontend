import { Suspense } from "react";
import MembersList from "@/components/dashboard/members/MembersList";

export default function MembersPage() {
  return (
    <Suspense fallback={null}>
      <MembersList />
    </Suspense>
  );
}
