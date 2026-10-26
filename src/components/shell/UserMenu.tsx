"use client";

import { useId } from "react";
import { cx } from "../ui/cx";
import type { ShellUser } from "./types";
import { usePopover } from "./usePopover";
import s from "./RoleShell.module.scss";

export interface UserMenuProps {
  user?: ShellUser | null;
  roleLabel: string;
  onLogout?: () => void;
}

function initials(user?: ShellUser | null): string {
  const src = user?.name?.trim() || user?.email || "";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Avatar button with name, role and logout. */
export function UserMenu({ user, roleLabel, onLogout }: UserMenuProps) {
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
      </div>
    </div>
  );
}

export default UserMenu;
