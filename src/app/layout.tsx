import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RoomProvider } from "@/components/RoomProvider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "LestGo",
  description: "Bucket list, kenangan, dan rencana kencan berdua.",
  appleWebApp: { capable: true, title: "LestGo", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <RoomProvider>
          <AppShell>{children}</AppShell>
        </RoomProvider>
      </body>
    </html>
  );
}
