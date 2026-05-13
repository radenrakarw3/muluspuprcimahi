import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Lapor PUPR Cimahi",
    template: "%s • Lapor PUPR Cimahi",
  },
  description:
    "Kanal resmi laporan kerusakan jalan, lampu PJU, drainase, dan infrastruktur lainnya di Kota Cimahi.",
  manifest: "/manifest.webmanifest",
  applicationName: "Lapor PUPR Cimahi",
  appleWebApp: { capable: true, title: "Lapor PUPR" },
  openGraph: {
    type: "website",
    siteName: "Lapor PUPR Cimahi",
    title: "Lapor PUPR Cimahi",
    description:
      "Laporkan kerusakan infrastruktur di Kota Cimahi. Dipantau langsung oleh Dinas PUPR.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f8a4c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
