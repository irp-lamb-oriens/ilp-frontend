import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/seo/og";

export const alt = "Colombia legal dates, on your calendar first. International Legal Partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    eyebrow: "Colombia",
    title: "Colombia legal dates, on your calendar first.",
    sub: "Visa registration, cédula de extranjería, DIAN returns, predial and matrícula mercantil.",
  });
}
