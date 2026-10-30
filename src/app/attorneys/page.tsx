import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import LawyersLanding from "@/components/lawyers/LawyersLanding";
import Narrator from "@/components/narration/Narrator";

export const metadata: Metadata = pageMetadata("/attorneys", { ownOgImage: true });

/** Lawyers landing (linked from Nav as For Lawyers). /lawyers redirects here; the form is /lawyers/apply. */
export default function AttorneysPage() {
  return (
    <>
      <Nav />
      <LawyersLanding />
      <Narrator page="lawyers" />
    </>
  );
}
