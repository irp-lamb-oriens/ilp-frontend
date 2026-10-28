import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free deadline check | International Legal Partner",
  description:
    "Answer a few questions and see the dates that may apply to you in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain: residency, property, companies, taxes, vehicles and employees.",
};

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
