import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "Costa Rica legal dates, on your calendar first. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Costa Rica",
    title: "Costa Rica legal dates, on your calendar first.",
    sub: "DIMEX renewal, CCSS payments, municipal property tax, corporation tax and the marchamo.",
  });
}
