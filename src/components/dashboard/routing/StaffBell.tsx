"use client";

import { useMemo } from "react";
import { staffApi } from "@/lib/api";
import { bellSource } from "@/lib/notifications";
import { NotificationCenter } from "@/components/shell/NotificationCenter";

/**
 * Staff bell (COMMS-P3): the shared notification center on /api/notifications.
 * Shows staff-wide alerts (routing, privacy, lawyers) and anything addressed
 * to this person; the count is what they have not read.
 */
export function StaffBell() {
  const source = useMemo(() => bellSource(staffApi, "/api/notifications"), []);
  return <NotificationCenter source={source} portal="staff" emptyText="No alerts. When no lawyer can take a member, or a privacy request arrives, it shows here." />;
}
