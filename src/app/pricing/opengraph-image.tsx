import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "US$79.99 a month, plus a US$100 activation fee. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Pricing",
    title: "US$79.99 a month, plus a US$100 activation fee.",
    sub: "Up to three 20-minute video calls a month with a lawyer licensed in your country. Other legal work is quoted.",
  });
}
