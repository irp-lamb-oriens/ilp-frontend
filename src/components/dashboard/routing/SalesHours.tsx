"use client";

import { useMemo } from "react";
import { staffApi } from "@/lib/api";
import AvailabilityView, { type AvailabilityAdapter } from "@/components/lawyer/AvailabilityView";
import type { AvailabilitySettings } from "@/components/lawyer/callsApi";

/**
 * Settings → Sales calls: the weekly hours of the sales team. When no lawyer
 * matches a member, a 15-minute call is booked in the first free time here,
 * with the sales inbox (SALES_EMAILS) invited. It never uses membership minutes.
 */
export function SalesHours() {
  const adapter = useMemo<AvailabilityAdapter>(() => ({
    load: () => staffApi.get<AvailabilitySettings>("/api/dashboard/routing/sales-hours"),
    save: (input) => staffApi.put<AvailabilitySettings>("/api/dashboard/routing/sales-hours", input),
  }), []);
  return (
    <AvailabilityView
      adapter={adapter}
      title="Sales team hours"
      showBack={false}
      audience="staff"
      hideSpecialties
      sub="When no lawyer matches a member, a 15-minute call with the sales team is booked in the first free time inside these hours. The sales inbox gets the invitation and the member's basics. These calls never use membership minutes."
      unsavedMessage="The sales hours have changes that are not saved yet. If you leave now, they will be lost."
    />
  );
}
