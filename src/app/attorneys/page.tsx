import type { Metadata } from "next";
import Nav from "@/components/Nav";
import LawyersLanding from "@/components/lawyers/LawyersLanding";

export const metadata: Metadata = {
  title: "For lawyers: take ILP member calls in Costa Rica | ILP",
  description:
    "Partner lawyers licensed in Costa Rica take 20-minute video calls with ILP members. Each call comes with a one-screen brief, you confirm the summary, and ILP handles the follow-up.",
};

/** Lawyers landing (linked from Nav as For Lawyers). /lawyers redirects here; the form is /lawyers/apply. */
export default function AttorneysPage() {
  return (
    <>
      <Nav />
      <LawyersLanding />
    </>
  );
}
