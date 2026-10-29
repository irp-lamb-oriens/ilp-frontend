import type { Metadata } from "next";
import { headers } from "next/headers";
import SmoothScroll from "@/components/SmoothScroll";
import LeadModal from "@/components/LeadModal";
import SiteLegal from "@/components/legal/SiteLegal";
import { UnsavedChangesGuard } from "@/components/ui/UnsavedChanges";
import TutorialRoot from "@/tutorials/TutorialRoot";
import JourneyTracker from "@/lib/journey/JourneyTracker";
import "@/styles/global.scss";

export const metadata: Metadata = {
  title: "International Legal Partner",
  description:
    "A legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain: calls with a lawyer licensed in your country, a living legal profile, follow-up from your customer success manager, and a free deadline check.",
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
