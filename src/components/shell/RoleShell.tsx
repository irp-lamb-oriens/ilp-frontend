"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Drawer } from "../ui/Drawer";
import { cx } from "../ui/cx";
import { useLeaveGuard } from "../ui/UnsavedChanges";
import { HelpButton } from "../tutorial/HelpButton";
import { useTutorialAutoStart } from "../tutorial/autostart";
import { useTutorialOptional } from "../tutorial/context";
import { CountrySwitcher } from "./CountrySwitcher";
import { useCountryContext } from "@/lib/countryContext";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { DEFAULT_NAV, ROLE_LABEL, SEARCH_PLACEHOLDER } from "./navConfig";
import type { MenuLink, NavItem, ShellRole, ShellUser } from "./types";
import s from "./RoleShell.module.scss";

export interface RoleShellProps {
  role: ShellRole;
  /** Defaults to DEFAULT_NAV[role]. */
  nav?: NavItem[];
  /** Page title rendered as the h1 above the content. */
  title?: ReactNode;
  /** Right side of the page header, e.g. a primary action. */
  actions?: ReactNode;
  user?: ShellUser | null;
  onLogout?: () => void;
  /** Shows "Sign out on all devices" in the user menu (e.g. `() => staffApi.logoutAll().then(...)`). */
  onLogoutAll?: () => void;
  /** Links in the user menu above "Sign out" (data and privacy, legal pages). */
  menuLinks?: MenuLink[];
  /** Called on submit of the global search. Omit to hide the search input. */
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  /** Bell slot. Defaults to <NotificationBell count={0} />; pass null to hide. */
  bell?: ReactNode;
  country?: string;
  onCountryChange?: (code: string) => void;
  /** Hide the country switcher (e.g. client portal). Default shown. */
  showCountry?: boolean;
  /** Override the brand link target. */
  homeHref?: string;
  /** Render inside a frame (the /ui gallery) instead of the full viewport. */
  embedded?: boolean;
  children: ReactNode;
}

const COLLAPSE_KEY = "ilp_shell_nav_collapsed";
const BOTTOM_MAX = 5;

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function glyph(item: NavItem): ReactNode {
  return item.icon ?? item.label.slice(0, 1);
}

/**
 * One layout for all three role homes: collapsible side nav on desktop, a
 * bottom bar on phones (< 768px), and a top bar with search, country
 * switcher, bell and user menu.
 */
export function RoleShell({
  role,
  nav,
  title,
  actions,
  user,
  onLogout,
  onLogoutAll,
  menuLinks,
  onSearch,
  searchPlaceholder,
  bell,
  country,
  onCountryChange,
  showCountry = true,
  homeHref,
  embedded = false,
  children,
}: RoleShellProps) {
  const pathname = usePathname();
  // COUNTRIES: without a controlled value the switcher drives the shared country context.
  const [ctxCountry, setCtxCountry] = useCountryContext();
  const items = nav ?? DEFAULT_NAV[role];
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Nav, bottom-bar, "More" and brand links are next/link: the root
  // UnsavedChangesGuard asks before they leave a dirty form. Search and
  // logout navigate from code, so they go through the same guard here.
  const leave = useLeaveGuard();
  // Tutorials: the "?" button, the user-menu list and the first-visit
  // auto-start (only once the viewer is signed in, never in the /ui gallery).
  const tutorials = useTutorialOptional();
  useTutorialAutoStart(role, !!user && !embedded);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // storage unavailable: keep expanded
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q && onSearch) void leave.guard(() => onSearch(q));
  }

  const overflow = items.length > BOTTOM_MAX;
  const bottomItems = overflow ? items.slice(0, BOTTOM_MAX - 1) : items;
  const moreItems = overflow ? items.slice(BOTTOM_MAX - 1) : [];
  const moreActive = moreItems.some((i) => isActive(pathname, i));
  const roleLabel = ROLE_LABEL[role];
  const home = homeHref ?? items[0]?.href ?? "/";

  return (
    <div className={cx(s.shell, collapsed && s.collapsed, embedded && s.embedded)} data-role={role}>
      <a href={`#shell-main-${role}`} className={s.skip}>
        Skip to content
      </a>

      <aside className={s.sidenav} aria-label={`${roleLabel} navigation`}>
        <div className={s.brandRow}>
          <Link href={home} className={s.brand}>
            <span className={s.brandMark}>ILP</span>
            <span className={s.brandRole}>{roleLabel}</span>
          </Link>
        </div>
        <nav className={s.navList}>
          {items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(s.navLink, active && s.navActive)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className={s.navIcon} aria-hidden="true">
                  {glyph(item)}
                </span>
                <span className={s.navLabel}>{item.label}</span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className={s.navBadge}>
                    {item.badge}
                    <span className={s.srOnly}> open</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className={s.collapseBtn}
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          <span className={s.navLabel}>Collapse</span>
        </button>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <Link href={home} className={s.topBrand}>
            <span className={s.brandMarkDark}>ILP</span>
            <span className={s.srOnly}>{roleLabel} home</span>
          </Link>
          {onSearch && (
            <form role="search" className={s.search} onSubmit={submitSearch}>
              <label htmlFor={`shell-search-${role}`} className={s.srOnly}>
                Search
              </label>
              <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                id={`shell-search-${role}`}
                type="search"
                className={s.searchInput}
                placeholder={searchPlaceholder ?? SEARCH_PLACEHOLDER[role]}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </form>
          )}
          <div className={s.topActions}>
            {showCountry && (
              <div className={s.countrySlot}>
                <CountrySwitcher value={country ?? ctxCountry} onChange={onCountryChange ?? setCtxCountry} allowAll={role === "staff"} />
              </div>
            )}
            <HelpButton role={role} />
            {bell === undefined ? <NotificationBell /> : bell}
            <UserMenu
              user={user}
              roleLabel={roleLabel}
              onLogout={onLogout && (() => void leave.guard(onLogout, { title: "Sign out without saving?", confirmLabel: "Sign out without saving" }))}
              onLogoutAll={onLogoutAll && (() => void leave.guard(onLogoutAll, { title: "Sign out without saving?", confirmLabel: "Sign out without saving" }))}
              links={menuLinks}
              onOpenTutorials={tutorials ? () => tutorials.openList(role) : undefined}
            />
          </div>
        </header>

        <main id={`shell-main-${role}`} className={s.content} tabIndex={-1}>
          {(title || actions) && (
            <div className={s.pageHead}>
              {title && <h1 className={s.pageTitle}>{title}</h1>}
              {actions && <div className={s.pageActions}>{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className={s.bottombar} aria-label={`${roleLabel} navigation`}>
        {bottomItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(s.bottomLink, active && s.bottomActive)}
              aria-current={active ? "page" : undefined}
            >
              <span className={s.bottomIcon} aria-hidden="true">
                {glyph(item)}
              </span>
              <span className={s.bottomLabel}>{item.label}</span>
            </Link>
          );
        })}
        {overflow && (
          <button
            type="button"
            className={cx(s.bottomLink, moreActive && s.bottomActive)}
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
          >
            <span className={s.bottomIcon} aria-hidden="true">
              ⋯
            </span>
            <span className={s.bottomLabel}>More</span>
          </button>
        )}
      </nav>

      {overflow && (
        <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
          <nav className={s.moreList} aria-label="More navigation">
            {moreItems.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(s.moreLink, active && s.moreActive)}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {showCountry && (
              <div className={s.moreCountry}>
                <CountrySwitcher value={country ?? ctxCountry} onChange={onCountryChange ?? setCtxCountry} allowAll={role === "staff"} />
              </div>
            )}
          </nav>
        </Drawer>
      )}
    </div>
  );
}

export default RoleShell;
