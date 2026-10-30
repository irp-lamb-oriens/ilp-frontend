import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import CsmLanding from "@/components/customerSuccess/CsmLanding";
import Narrator from "@/components/narration/Narrator";

export const metadata: Metadata = pageMetadata("/customer-success", { ownOgImage: true });

/** Customer success landing (linked from Nav as Customer success and from the footer). CSMs sign in at /csm. */
export default function CustomerSuccessPage() {
  return (
    <>
      <Nav />
      <CsmLanding />
      <Narrator page="csm" />
    </>
  );
}
