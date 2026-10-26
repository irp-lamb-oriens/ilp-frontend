import type { Country, NavItem, ShellRole } from "./types";

/**
 * Default navigation per role, from docs/PLAN.md and the overhaul plan.
 * Portal owners (W4 client, W5 lawyer, W6 staff) may pass their own `nav`.
 */
export const DEFAULT_NAV: Record<ShellRole, NavItem[]> = {
  client: [
    { href: "/status", label: "Overview", icon: "◧", match: "exact" },
    { href: "/status/profile", label: "Profile", icon: "◔" },
    { href: "/status/money", label: "Money", icon: "$" },
    { href: "/status/messages", label: "Messages", icon: "✉" },
  ],
  lawyer: [
    { href: "/lawyer", label: "Today", icon: "◷", match: "exact" },
    { href: "/lawyer/board", label: "Board", icon: "▦" },
    { href: "/lawyer/clients", label: "Clients", icon: "☰" },
    { href: "/lawyer/finance", label: "Finance", icon: "$" },
    { href: "/lawyer/availability", label: "Availability", icon: "◴" },
  ],
  staff: [
    { href: "/dashboard", label: "Today", icon: "◷", match: "exact" },
    { href: "/dashboard/members", label: "Members", icon: "☰" },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: "▦" },
    { href: "/dashboard/opportunities", label: "Opportunities", icon: "◇" },
    { href: "/dashboard/lawyers", label: "Lawyers", icon: "§" },
    { href: "/dashboard/finance", label: "Finance", icon: "$" },
    { href: "/dashboard/reports", label: "Reports", icon: "▤" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
  ],
};

export const ROLE_LABEL: Record<ShellRole, string> = {
  client: "Member",
  lawyer: "Lawyer",
  staff: "Staff",
};

export const SEARCH_PLACEHOLDER: Record<ShellRole, string> = {
  client: "Search your matters and documents",
  lawyer: "Search clients and matters",
  staff: "Search members, matters, lawyers",
};

/** Launch order: Costa Rica live, Panama and Mexico next (plan scope). */
export const COUNTRIES: Country[] = [
  { code: "CR", name: "Costa Rica", available: true },
  { code: "PA", name: "Panama", available: false },
  { code: "MX", name: "Mexico", available: false },
];
