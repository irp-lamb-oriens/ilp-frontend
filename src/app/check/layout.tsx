import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("/check", { ownOgImage: true });

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
