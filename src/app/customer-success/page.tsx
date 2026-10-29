import type { Metadata } from "next";
import Nav from "@/components/Nav";
import CsmLanding from "@/components/customerSuccess/CsmLanding";
import Narrator from "@/components/narration/Narrator";

export const metadata: Metadata = {
  title: "Customer success at ILP: look after members in six countries | ILP",
  description:
    "Customer success managers are ILP members' contact at ILP: the welcome call, a profile ready for the first lawyer call, the lawyer's next steps sent after it, quotes followed up and renewals checked. CSMs sign in to the CSM portal.",
};

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
