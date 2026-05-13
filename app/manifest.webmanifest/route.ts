export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "Lapor PUPR Cimahi",
    short_name: "Lapor PUPR",
    description: "Kanal resmi laporan kerusakan infrastruktur Kota Cimahi.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f8a4c",
    lang: "id",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
