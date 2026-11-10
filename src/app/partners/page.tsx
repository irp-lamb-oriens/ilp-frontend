import type { Metadata } from "next";
import PartnerPortal from "@/components/partners/PartnerPortal";

export const metadata: Metadata = {
  title: "Partner portal | ILP",
  robots: { index: false, follow: false },
};

export default function PartnersPage() {
  return <PartnerPortal />;
}
