import type { Metadata } from "next";
import UiGallery from "./UiGallery";

export const metadata: Metadata = {
  title: "UI kit · ILP",
  description: "Every shared primitive and the role shell, with sample data.",
  robots: { index: false, follow: false },
};

export default function UiPage() {
  return <UiGallery />;
}
