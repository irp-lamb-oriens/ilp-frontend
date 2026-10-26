import type { Metadata } from "next";
import { headers } from "next/headers";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // P6 CSP: reading the request headers renders every page per request, so
  // Next.js can put this request's nonce (set by src/middleware.ts) on its
  // scripts. A prerendered page would ship without one and be blocked.
  await headers();
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <LeadModal />
      </body>
    </html>
  );
}
