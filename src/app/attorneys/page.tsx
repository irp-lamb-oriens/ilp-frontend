import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import LawyersLanding from "@/components/lawyers/LawyersLanding";
import Narrator from "@/components/narration/Narrator";
import JsonLd from "@/components/seo/JsonLd";
import { LAWYER_FAQ } from "@/components/lawyers/content";
import { breadcrumbLd, faqLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = pageMetadata("/attorneys", { ownOgImage: true });

/** Lawyers landing (linked from Nav as For Lawyers). /lawyers redirects here; the form is /lawyers/apply. */
export default function AttorneysPage() {
  return (
    <>
      <Nav />
      <LawyersLanding />
      <Narrator page="lawyers" />
      <JsonLd data={[faqLd(LAWYER_FAQ), breadcrumbLd([["For lawyers", "/attorneys"]])]} />
    </>
  );
}
