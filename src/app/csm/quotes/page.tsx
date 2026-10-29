"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmQuotes } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="quotes">
      <CsmQuotes />
    </CsmScreen>
  );
}
