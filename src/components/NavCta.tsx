"use client";

import { openLeadForm } from "@/lib/leadEvents";

/** Nav CTA: opens the global lead form from any page, no navigation. */
export default function NavCta({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openLeadForm({ topic: "Free compliance check" })}>
      Get alerted
    </button>
  );
}