import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LestGo",
    short_name: "LestGo",
    description: "Our bucket list, memories and date plans.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#800020",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
