import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "Portugal legal dates, on your calendar first. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Portugal",
    title: "Portugal legal dates, on your calendar first.",
    sub: "Permit renewal with AIMA, IRS returns, IMI property tax and IUC.",
  });
}
