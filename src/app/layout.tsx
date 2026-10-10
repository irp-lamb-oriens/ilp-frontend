import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import LeadModal from "@/components/LeadModal";
import "@/styles/global.scss";

export const metadata: Metadata = {
  title: "International Legal Partner",
  description:
    "Smart Compliance Alerts, legal updates, templates, and consultations across Costa Rica, Panama, and beyond.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <LeadModal />
      </body>
    </html>
  );
}