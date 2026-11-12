import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import SmoothScroll from "@/components/SmoothScroll";
import LeadModal from "@/components/LeadModal";
import SiteLegal from "@/components/legal/SiteLegal";
import { UnsavedChangesGuard } from "@/components/ui/UnsavedChanges";
import TutorialRoot from "@/tutorials/TutorialRoot";
import JourneyTracker from "@/lib/journey/JourneyTracker";
import BehaviorTracker from "@/lib/journey/BehaviorTracker";
import SyncNotice from "@/components/shell/SyncNotice";
import ChunkReload from "@/components/shell/ChunkReload";
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
  // QA round 1: /favicon.ico was a 404 and the 1255px logo was the only icon.
  // Small, sized files instead; apple-touch-icon plus the manifest
  // (app/manifest.ts) let iPhone members add ILP to the Home Screen, which
  // iOS requires before it delivers web push (deadline reminders).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "ILP", statusBarStyle: "default" },
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
          <BehaviorTracker />
          <SyncNotice />
          <ChunkReload />
        </TutorialRoot>
      </body>
    </html>
  );
}
