import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LestGo",
    short_name: "LestGo",
    description: "Bucket list, kenangan, dan rencana kencan berdua.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf5ff",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
