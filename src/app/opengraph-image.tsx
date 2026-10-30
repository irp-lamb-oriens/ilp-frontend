import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "International Legal Partner: a legal membership in six countries.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Legal membership",
    title: "Your legal life abroad, kept in one place.",
    sub: "Calls with a lawyer licensed in your country, a legal profile and reminders before legal dates. Six countries. US$79.99 a month.",
  });
}
