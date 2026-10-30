"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MeasurementChoice from "./MeasurementChoice";
import { LEGAL_DOCS } from "./versions";
import s from "./SiteLegal.module.scss";

/** Membership pages, linked from every public page so none is an orphan (SEO). */
const MEMBERSHIP_LINKS = [
  { href: "/check", label: "Free deadline check" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/join", label: "Join" },
  { href: "/about", label: "About ILP" },
  { href: "/liability-protection", label: "Liability protection (planned)" },
];

/** Country pages, the main entry points from search. */
const COUNTRY_LINKS = [
  { href: "/colombia", label: "Colombia" },
  { href: "/costa-rica", label: "Costa Rica" },
  { href: "/mexico", label: "Mexico" },
  { href: "/panama", label: "Panama" },
  { href: "/portugal", label: "Portugal" },
  { href: "/spain", label: "Spain" },
];

/** App areas with their own shell; legal links live in their menus instead. */
const APP_PREFIXES = ["/dashboard", "/csm", "/lawyer", "/status", "/ui"];

/**
 * Legal links and the measurement-id notice under every public page (P6),
 * after the links for lawyers and for customer success managers.
 * Rendered once from the root layout, in the page flow (no overlay), and
 * hidden inside the signed-in app shells.
 */
export default function SiteLegal() {
  const path = usePathname() ?? "/";
  if (APP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <MeasurementChoice compact />
        <nav aria-label="Membership">
          <ul className={s.links}>
            {MEMBERSHIP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Countries">
          <ul className={s.links}>
            {COUNTRY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Work with ILP">
          <ul className={s.links}>
            <li>
              <Link href="/attorneys">For lawyers</Link>
            </li>
            <li>
              <Link href="/lawyers/apply">Apply as a partner lawyer</Link>
            </li>
            <li>
              <Link href="/customer-success">Customer success at ILP</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <ul className={s.links}>
            <li>
              <Link href="/legal">All legal documents</Link>
            </li>
            {LEGAL_DOCS.map((d) => (
              <li key={d.href}>
                <Link href={d.href}>{d.short}</Link>
              </li>
            ))}
            <li>
              <Link href="/status/privacy">Your data</Link>
            </li>
            <li>
              <Link href="/legal/cookies#measure-title">Measurement choice</Link>
            </li>
          </ul>
        </nav>
        <p className={s.note}>
          International Legal Partner is a membership service, not a law firm. Information on this site is general
          information, not legal advice.
        </p>
      </div>
    </footer>
  );
}
