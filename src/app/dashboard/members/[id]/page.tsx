"use client";

import { useParams } from "next/navigation";
import MemberPage from "@/components/dashboard/member/MemberPage";

export default function MemberRoute() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  return <MemberPage key={id} clientId={id} />;
}
