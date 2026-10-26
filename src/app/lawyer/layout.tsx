import type { Metadata } from "next";
import type { ReactNode } from "react";
import LawyerGate from "@/components/lawyer/LawyerGate";

export const metadata: Metadata = {
  title: "Lawyer | ILP",
  robots: { index: false, follow: false },
};

export default function LawyerLayout({ children }: { children: ReactNode }) {
  return <LawyerGate>{children}</LawyerGate>;
}
