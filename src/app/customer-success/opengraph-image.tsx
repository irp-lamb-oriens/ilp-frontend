import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "The member's contact at ILP. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Customer success",
    title: "The member's contact at ILP.",
    sub: "Welcome calls, profiles ready for the first lawyer call, next steps sent after it, and quotes followed up.",
  });
}
