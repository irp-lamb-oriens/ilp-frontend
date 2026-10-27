"use client";

import { useId } from "react";
import Link from "next/link";
import { cx } from "../ui/cx";
import type { MenuLink, ShellUser } from "./types";
import { usePopover } from "./usePopover";
import s from "./RoleShell.module.scss";

export interface UserMenuProps {
  user?: ShellUser | null;
  roleLabel: string;
  onLogout?: () => void;
  /** Optional "Log out on all devices" (the role's /auth/logout-all route). */
  onLogoutAll?: () => void;
  /** Links listed above "Log out" (e.g. data and privacy, legal pages). */
  links?: MenuLink[];
  /** Opens the "Tutorials" list (replay and reset). */
  onOpenTutorials?: () => void;
}

function initials(user?: ShellUser | null): string {
  const src = user?.name?.trim() || user?.email || "";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Avatar button with name, role and logout. */
export function UserMenu({ user, roleLabel, onLogout, onLogoutAll, links, onOpenTutorials }: UserMenuProps) {
  const menuId = useId();
  const { open, toggle, close, rootRef, triggerRef } = usePopover();

  return (
    <div className={s.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={s.avatarButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user?.name ?? user?.email ?? roleLabel}`}
        onClick={toggle}
      >
        <span className={s.avatar} aria-hidden="true">
          {initials(user)}
        </span>
      </button>
      <div id={menuId} role="menu" className={cx(s.menu, s.menuRight, open && s.menuOpen)} aria-hidden={!open}>
        <div className={s.menuHeader}>
          <span className={s.menuName}>{user?.name ?? user?.email ?? "Signed in"}</span>
          {user?.name && <span className={s.menuSub}>{user.email}</span>}
          <span className={s.menuSub}>{user?.title ?? roleLabel}</span>
        </div>
        {links && links.length > 0 && (
          <div className={s.menuGroup}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} role="menuitem" className={s.menuItem} onClick={() => close(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
        {onOpenTutorials && (
          <div className={s.menuGroup}>
            <button
              type="button"
              role="menuitem"
              className={s.menuItem}
              onClick={() => {
                close(false);
                onOpenTutorials();
              }}
            >
              Tutorials
            </button>
          </div>
        )}
        <button
          type="button"
          role="menuitem"
          className={s.menuItem}
          onClick={() => {
            close(false);
            onLogout?.();
          }}
        >
          Log out
        </button>
        {onLogoutAll && (
          <button
            type="button"
            role="menuitem"
            className={s.menuItem}
            onClick={() => {
              close(false);
              onLogoutAll();
            }}
          >
            Log out on all devices
          </button>
        )}
      </div>
    </div>
  );
}

export default UserMenu;
