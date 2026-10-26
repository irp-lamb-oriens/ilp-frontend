"use client";

import s from "./RoleShell.module.scss";

export interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

/** Default bell for the top-bar slot. Pass your own node via RoleShell `bell`. */
export function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";
  return (
    <button type="button" className={s.iconButton} aria-label={label} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z M10 19a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className={s.bellCount} aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
