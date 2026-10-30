import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "Panama legal dates, on your calendar first. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Panama",
    title: "Panama legal dates, on your calendar first.",
    sub: "Provisional residency cards, the tasa única, your resident agent and property tax installments.",
  });
}
