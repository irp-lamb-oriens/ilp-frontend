import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "International Legal Partner",
    short_name: "ILP",
    description: "A legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.",
    id: "/",
    start_url: "/status",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123b5d",
    lang: "en",
    // Installed from the Home Screen, members land on their own page (/status).
    // iOS delivers web push only to Home Screen web apps (deadline reminders).
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
