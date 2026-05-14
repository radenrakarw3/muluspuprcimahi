import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  BRAND_SHORT,
  SITE_DESCRIPTION,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
} from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: SITE_TITLE_DEFAULT,
  appleWebApp: { capable: true, title: BRAND_SHORT },
  openGraph: {
    type: "website",
    siteName: SITE_TITLE_DEFAULT,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5cc33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
