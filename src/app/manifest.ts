import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "International Legal Partner",
    short_name: "ILP",
    description: "A legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123b5d",
    lang: "en",
    icons: [{ src: "/logo.png", sizes: "408x408", type: "image/png", purpose: "any" }],
  };
}
