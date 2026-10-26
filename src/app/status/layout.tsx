import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import StatusApp from "@/components/status/StatusApp";

export const metadata: Metadata = {
  title: "Your ILP home",
  robots: { index: false, follow: false },
};

/** Every /status route shares one sign-in check, one member shell and one data load. */
export default function StatusLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <StatusApp>{children}</StatusApp>
    </Suspense>
  );
}
