import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

/** A signed-in view of one person's alerts: never indexed. */
export const metadata: Metadata = {
  title: "Your deadline alerts | ILP",
  robots: NOINDEX,
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
