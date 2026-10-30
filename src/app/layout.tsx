import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import SmoothScroll from "@/components/SmoothScroll";
import LeadModal from "@/components/LeadModal";
import SiteLegal from "@/components/legal/SiteLegal";
import { UnsavedChangesGuard } from "@/components/ui/UnsavedChanges";
import TutorialRoot from "@/tutorials/TutorialRoot";
import JourneyTracker from "@/lib/journey/JourneyTracker";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";
import "@/styles/global.scss";

const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

/**
 * Site-wide defaults (SEO workstream). Each public page sets its own title,
 * description and canonical from lib/seo/site.ts; portals set noindex in
 * their layouts. metadataBase makes every canonical and image URL absolute.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} (ILP)`, template: "%s" },
  description:
    "A legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain: calls with a lawyer licensed in your country, a legal profile and reminders.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", images: [DEFAULT_OG_IMAGE] },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png", sizes: "408x408" }],
    apple: [{ url: "/logo.png", sizes: "408x408" }],
  },
  formatDetection: { telephone: false },
  ...(verification || bingVerification
    ? {
        verification: {
          ...(verification ? { google: verification } : {}),
          ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
        },
      }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        <TutorialRoot>
          <SmoothScroll>{children}</SmoothScroll>
          <LeadModal />
          <SiteLegal />
          <UnsavedChangesGuard />
          <JourneyTracker />
        </TutorialRoot>
      </body>
    </html>
  );
}
