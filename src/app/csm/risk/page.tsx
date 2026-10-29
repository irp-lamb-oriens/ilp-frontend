"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmRisk } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="risk">
      <CsmRisk />
    </CsmScreen>
  );
}
