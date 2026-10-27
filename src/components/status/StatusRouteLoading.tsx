"use client";

import { usePathname } from "next/navigation";
import { SkeletonRegion, useSkeleton } from "@/components/ui";
import StatusRouteSkeleton from "./StatusSkeletons";

/**
 * Body of every /status `loading.tsx`. Next.js shows it inside the member
 * shell the moment a link is clicked, while the route's server payload is on
 * its way. It is the same skeleton the gate and the page use, so the swap to
 * the page (or to the page's own skeleton) never changes shape.
 *
 * `pathname` pins the layout for a segment's own loading file; the /status
 * root file reads the URL so it also fits child routes it stands in for.
 */
export default function StatusRouteLoading({ pathname }: { pathname?: string }) {
  const current = usePathname() ?? "/status";
  const { skeletonVisible } = useSkeleton(true);
  return (
    <SkeletonRegion label="Opening this page" visible={skeletonVisible}>
      <StatusRouteSkeleton pathname={pathname ?? current} />
    </SkeletonRegion>
  );
}
