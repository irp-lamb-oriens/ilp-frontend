import { createElement } from "react";
import { IconCard, IconChat, IconHome, IconPerson } from "../status/navIcons";
import {
  IconNavBoard,
  IconNavBriefcase,
  IconNavCalendar,
  IconNavChart,
  IconNavList,
  IconNavMoney,
  IconNavPeople,
  IconNavSliders,
  IconNavTag,
  IconNavToday,
} from "./navIcons";
import type { Country, MenuLink, NavItem, ShellRole } from "./types";
import { COUNTRIES as CONTRACT_COUNTRIES, COUNTRY_CODES } from "@/lib/contracts";

/**
 * Default navigation per role, from docs/PLAN.md and the overhaul plan.
 * Portal owners (W4 client, W5 lawyer, W6 staff) may pass their own `nav`.
 */
export const DEFAULT_NAV: Record<ShellRole, NavItem[]> = {
  client: [
    // T6: SVG icons (same set as the member portal nav) instead of glyphs and the envelope emoji.
    { href: "/status", label: "Overview", icon: createElement(IconHome), match: "exact" },
    { href: "/status/profile", label: "Profile", icon: createElement(IconPerson) },
    { href: "/status/money", label: "Money", icon: createElement(IconCard) },
    { href: "/status/messages", label: "Messages", icon: createElement(IconChat) },
  ],
  lawyer: [
    // T7: SVG icons for every portal (no text glyphs).
    { href: "/lawyer", label: "Today", icon: createElement(IconNavToday), match: "exact" },
    { href: "/lawyer/board", label: "Board", icon: createElement(IconNavBoard) },
    { href: "/lawyer/clients", label: "Clients", icon: createElement(IconNavList) },
    { href: "/lawyer/finance", label: "Finance", icon: createElement(IconNavMoney) },
    { href: "/lawyer/availability", label: "Availability", icon: createElement(IconNavCalendar) },
  ],
  // The live staff nav is staffNav() in components/dashboard/staff/StaffSession.tsx (same icons).
  staff: [
    { href: "/dashboard", label: "Today", icon: createElement(IconNavToday), match: "exact" },
    { href: "/dashboard/members", label: "Members", icon: createElement(IconNavPeople) },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: createElement(IconNavBoard) },
    { href: "/dashboard/opportunities", label: "Opportunities", icon: createElement(IconNavTag) },
    { href: "/dashboard/lawyers", label: "Lawyers", icon: createElement(IconNavBriefcase) },
    { href: "/dashboard/finance", label: "Finance", icon: createElement(IconNavMoney) },
    { href: "/dashboard/reports", label: "Reports", icon: createElement(IconNavChart) },
    { href: "/dashboard/settings", label: "Settings", icon: createElement(IconNavSliders) },
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

/** All six countries are open (contracts COUNTRIES, docs/workstreams/COUNTRIES.md). */
export const COUNTRIES: Country[] = COUNTRY_CODES.map((code) => ({ code, name: CONTRACT_COUNTRIES[code].name, available: true }));

/** Legal pages every signed-in shell links to from the user menu (P6/P7). */
export const LEGAL_MENU_LINKS: MenuLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Membership" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
];
