"use client";

import { CsmScreen } from "@/components/csm/CsmScreen";
import CsmPlaybooks from "@/components/csm/CsmPlaybooks";

export default function Page() {
  return (
    <CsmScreen intro="playbooks">
      <CsmPlaybooks />
    </CsmScreen>
  );
}
