"use client";

import { useParams } from "next/navigation";
import MemberPage from "@/components/dashboard/member/MemberPage";

/** The staff member page, on the CSM portal (scope enforced by the server). */
export default function CsmMemberRoute() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  return <MemberPage key={id} clientId={id} portal="csm" />;
}
