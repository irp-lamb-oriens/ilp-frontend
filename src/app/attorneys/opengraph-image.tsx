import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "Advise ILP members in your country. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "For lawyers",
    title: "Advise ILP members in your country.",
    sub: "20-minute video calls with a brief before each one. You confirm the summary; ILP handles the follow-up.",
  });
}
