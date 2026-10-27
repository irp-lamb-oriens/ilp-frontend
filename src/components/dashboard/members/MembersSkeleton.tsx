"use client";

import { Skeleton, SkeletonTable } from "@/components/ui";
import s from "./members.module.scss";

/** Column shapes of the members table (hidden on phones like the real ones). */
export const MEMBER_SKELETON_COLUMNS = [
  { header: "Member", width: "wide" as const },
  { header: "Membership" },
  { header: "Profile" },
  { header: "Minutes used", hideOnMobile: true, align: "end" as const },
  { header: "Renews", hideOnMobile: true },
  { header: "CSM", hideOnMobile: true },
  { header: "Open tasks", hideOnMobile: true, align: "end" as const },
];

/** Filters, sort row and table, before MembersList mounts (staff gate). */
export default function MembersSkeleton() {
  return (
    <>
      <div className={s.filters} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton shape="line" size="xs" width={i === 0 ? "25" : "40"} />
            <Skeleton shape="block" size="sm" />
          </div>
        ))}
      </div>
      <div className={s.sortRow} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} shape="pill" size="lg" width={i === 0 ? "pill-sm" : "pill"} />
        ))}
      </div>
      <SkeletonTable columns={MEMBER_SKELETON_COLUMNS} rows={8} />
    </>
  );
}
