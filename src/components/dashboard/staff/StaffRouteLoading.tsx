"use client";

import { usePathname } from "next/navigation";
import { SkeletonRegion, useSkeleton } from "@/components/ui";
import StaffRouteSkeleton from "./StaffRouteSkeleton";

/**
 * Body of every /dashboard `loading.tsx`: shown inside the staff shell the
 * moment a link is clicked. Same skeleton as the gate and the page, so the
 * swap never changes shape. `pathname` pins the layout for a segment's own
 * loading file; the /dashboard root file reads the URL.
 */
export default function StaffRouteLoading({ pathname }: { pathname?: string }) {
  const current = usePathname() ?? "/dashboard";
  const { skeletonVisible } = useSkeleton(true);
  return (
    <SkeletonRegion label="Opening this page" visible={skeletonVisible}>
      <StaffRouteSkeleton pathname={pathname ?? current} />
    </SkeletonRegion>
  );
}
