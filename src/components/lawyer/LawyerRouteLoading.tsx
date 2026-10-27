"use client";

import { usePathname } from "next/navigation";
import { SkeletonRegion, useSkeleton } from "@/components/ui";
import LawyerRouteSkeleton from "./LawyerSkeletons";

/**
 * Body of every /lawyer `loading.tsx`: shown inside the lawyer shell the
 * moment a link is clicked. Same skeleton as the gate and the page, so the
 * swap never changes shape. `pathname` pins the layout for a segment's own
 * loading file; the /lawyer root file reads the URL.
 */
export default function LawyerRouteLoading({ pathname }: { pathname?: string }) {
  const current = usePathname() ?? "/lawyer";
  const { skeletonVisible } = useSkeleton(true);
  return (
    <SkeletonRegion label="Opening this page" visible={skeletonVisible}>
      <LawyerRouteSkeleton pathname={pathname ?? current} />
    </SkeletonRegion>
  );
}
