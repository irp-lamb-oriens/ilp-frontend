"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmMessages } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="messages">
      <CsmMessages />
    </CsmScreen>
  );
}
