"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OPEN_LEAD_EVENT } from "@/lib/leadEvents";

/**
 * Global lead entry point. Mounted once in the root layout; every CTA that
 * calls `openLeadForm()` now lands on the free deadline check (/check), the
 * single front door of the join funnel. The check covers Costa Rica first and
 * explains that on its first screen, so no country is passed along.
 */
export default function LeadModal() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/check");
    const onOpen = () => router.push("/check");
    window.addEventListener(OPEN_LEAD_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LEAD_EVENT, onOpen);
  }, [router]);

  return null;
}
