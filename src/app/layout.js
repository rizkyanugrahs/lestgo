import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/AuthProvider";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata = {
  title: "LiveOps",
  description: "Your Workday, Under Control.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "LiveOps", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-aura min-h-screen text-white antialiased">
        <I18nProvider>
          <AuthProvider>
            <ServiceWorker />
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
