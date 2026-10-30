import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "See the legal dates that may apply to you. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Free deadline check",
    title: "See the legal dates that may apply to you.",
    sub: "Residency, property tax, companies and vehicles in six countries. About two minutes, no account.",
  });
}
