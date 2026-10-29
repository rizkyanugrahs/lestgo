import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RoomProvider } from "@/components/RoomProvider";
import { MeProvider } from "@/components/MeProvider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "LestGo",
  description: "Our bucket list, memories and date plans.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LestGo", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#800020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <RoomProvider>
          <MeProvider>
            <AppShell>{children}</AppShell>
          </MeProvider>
        </RoomProvider>
      </body>
    </html>
  );
}
