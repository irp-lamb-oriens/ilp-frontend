"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import CsmKpis from "@/components/csm/CsmKpis";

export default function Page() {
  return (
    <CsmScreen intro="kpis">
      <CsmKpis />
    </CsmScreen>
  );
}
