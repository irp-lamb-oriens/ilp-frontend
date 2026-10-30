import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/metadata";

/** Kept out of search until the template downloads are real (lib/seo/site.ts NOINDEX_PUBLIC). */
export const metadata: Metadata = {
  title: "Legal templates | ILP",
  robots: NOINDEX,
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
