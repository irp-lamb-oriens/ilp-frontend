"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy and join links (/status/<projectId>?welcome=1) land here. The member
 * is identified by the session, so the id is not needed: go to Overview and
 * keep the welcome flag.
 */
export default function LegacyProjectRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    router.replace(params?.get("welcome") === "1" ? "/status?welcome=1" : "/status");
  }, [router, params]);
  return null;
}
