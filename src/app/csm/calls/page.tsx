"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmCalls } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="calls">
      <CsmCalls />
    </CsmScreen>
  );
}
