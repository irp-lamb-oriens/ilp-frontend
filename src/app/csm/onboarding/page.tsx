"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import { CsmOnboarding } from "@/components/csm/CsmLists";

export default function Page() {
  return (
    <CsmScreen intro="onboarding">
      <CsmOnboarding />
    </CsmScreen>
  );
}
