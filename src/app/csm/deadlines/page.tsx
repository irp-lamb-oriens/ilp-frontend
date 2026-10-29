"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmDeadlines } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="deadlines">
      <CsmDeadlines />
    </CsmScreen>
  );
}
