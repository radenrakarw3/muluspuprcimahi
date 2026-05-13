/**
 * GET /api/nearby?lat=&lng=&category=slug
 * Cek laporan aktif di radius default (75m).
 */
import { NextResponse } from "next/server";
import { findNearbyActiveReports } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const category = url.searchParams.get("category") ?? "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !category) {
    return NextResponse.json({ error: "Param tidak lengkap" }, { status: 400 });
  }
  const items = await findNearbyActiveReports(lat, lng, category);
  return NextResponse.json({ items });
}
