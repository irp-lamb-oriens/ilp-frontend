import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { CsmFrame } from "@/components/csm/CsmFrame";

export const metadata: Metadata = {
  title: "Customer success | ILP",
  robots: { index: false, follow: false },
};

/** Every /csm route shares one session check and the CSM shell (COMMS-P3). */
export default function CsmLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CsmFrame>{children}</CsmFrame>
    </Suspense>
  );
}
