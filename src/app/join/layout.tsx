import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join ILP | International Legal Partner",
  description:
    "One membership: US$79.99 a month plus a US$100 activation, with 60 minutes a month of calls with a vetted Costa Rica lawyer.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
