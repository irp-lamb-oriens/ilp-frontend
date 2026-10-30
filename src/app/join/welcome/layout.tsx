import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

/** The after-payment screen: never indexed. */
export const metadata: Metadata = {
  title: "Welcome to ILP",
  robots: NOINDEX,
};

export default function JoinWelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
