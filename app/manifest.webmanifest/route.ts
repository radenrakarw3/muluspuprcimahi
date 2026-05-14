export const dynamic = "force-static";

import { BRAND_PROGRAM, BRAND_SHORT, SITE_DESCRIPTION } from "@/lib/brand";

export function GET() {
  const manifest = {
    name: BRAND_PROGRAM,
    short_name: BRAND_SHORT,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0c1830",
    theme_color: "#b8860b",
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
