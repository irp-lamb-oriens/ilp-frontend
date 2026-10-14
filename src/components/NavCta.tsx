"use client";

import { openLeadForm } from "@/lib/leadEvents";
import { CHECK_CTA } from "@/components/landing/content";

/** Nav CTA: opens the global lead form from any page, no navigation. */
export default function NavCta({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openLeadForm({ topic: "Free deadline check" })}>
      {CHECK_CTA}
    </button>
  );
}
