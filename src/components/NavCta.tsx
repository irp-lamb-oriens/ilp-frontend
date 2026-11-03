"use client";

import { openLeadForm } from "@/lib/leadEvents";
import { CHECK_CTA } from "@/components/landing/content";

/** Nav CTA: opens the global lead form from any page, no navigation. */
export default function NavCta({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openLeadForm({ topic: "Free deadline check" })}>
      <span data-cta="long">{CHECK_CTA}</span>
      {/* Phones: the long label leaves no room for the menu button. The hidden label is display:none, so the accessible name always matches what is shown. */}
      <span data-cta="short">
        Free deadline check
      </span>
    </button>
  );
}
