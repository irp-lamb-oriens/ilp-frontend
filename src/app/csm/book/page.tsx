"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import CsmBook from "@/components/csm/CsmBook";

export default function Page() {
  return (
    <CsmScreen intro="book">
      <CsmBook />
    </CsmScreen>
  );
}
