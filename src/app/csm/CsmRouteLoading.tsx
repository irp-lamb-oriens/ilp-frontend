"use client";

import { usePathname } from "next/navigation";
import { SkeletonRegion, useSkeleton } from "@/components/ui";
import CsmRouteSkeleton from "@/components/csm/CsmSkeletons";

/** Body of every /csm loading.tsx: the skeleton of the page that is opening. */
export default function CsmRouteLoading() {
  const pathname = usePathname() ?? "/csm";
  const { skeletonVisible } = useSkeleton(true);
  return (
    <SkeletonRegion label="Opening this page" visible={skeletonVisible}>
      <CsmRouteSkeleton pathname={pathname} />
    </SkeletonRegion>
  );
}
