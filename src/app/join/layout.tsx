import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("/join");

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
