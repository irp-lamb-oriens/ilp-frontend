import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StaffFrame } from "@/components/dashboard/staff/StaffSession";

export const metadata: Metadata = {
  title: "ILP staff",
  robots: { index: false, follow: false },
};

/** Every /dashboard route shares one session check and one staff shell. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <StaffFrame>{children}</StaffFrame>;
}
