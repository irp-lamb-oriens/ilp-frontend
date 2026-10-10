import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import LeadModal from "@/components/LeadModal";
import "@/styles/global.scss";

export const metadata: Metadata = {
  title: "International Legal Partner",
  description:
    "Trusted legal support for your life abroad. Clear, calm guidance for living, investing, and doing business in Costa Rica, Panama, and Mexico.",
  icons: {
    icon: "/logo.png",
  },
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