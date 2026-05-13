/**
 * GET /api/region?lat=&lng=
 * Mengembalikan kecamatan & kelurahan yang berisi titik (atau null jika di luar Cimahi).
 */
import { NextResponse } from "next/server";
import { findRegionContaining, isInsideCimahi } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng tidak valid" }, { status: 400 });
  }
  const inside = await isInsideCimahi(lat, lng);
  if (!inside) {
    return NextResponse.json({ insideCimahi: false, kecamatan: null, kelurahan: null });
  }
  const r = await findRegionContaining(lat, lng);
  return NextResponse.json({ insideCimahi: true, ...r });
}
