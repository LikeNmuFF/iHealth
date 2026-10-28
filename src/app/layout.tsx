import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "iHealth HapIsabela · Demo",
  description:
    "A fictional GIS-enabled planned referral prototype by Team Claudex.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "iHealth Demo",
    statusBarStyle: "default",
  },
  icons: {
    icon: { url: "/icon.png", type: "image/png", sizes: "48x48" },
    apple: "/icons/icon-192.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#245bcc",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-PH">
      <body>{children}</body>
    </html>
  );
}
