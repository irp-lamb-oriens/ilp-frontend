"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import CsmToday from "@/components/csm/CsmToday";

export default function Page() {
  return (
    <CsmScreen intro="today">
      <CsmToday />
    </CsmScreen>
  );
}
