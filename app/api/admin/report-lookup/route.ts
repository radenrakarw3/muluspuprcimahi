/**
 * GET /api/admin/report-lookup?kode=0458921 atau CMH-...
 * Admin-only: cari report ID berdasarkan kode untuk fitur "gabung duplikat".
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { normalizePublicReportKode } from "@/lib/report-code";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const kode = normalizePublicReportKode(url.searchParams.get("kode") ?? "");
  if (!kode) return NextResponse.json({ error: "kode required" }, { status: 400 });
  const r = (
    await db.select({ id: reports.id }).from(reports).where(eq(reports.kode, kode))
  )[0];
  if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(r);
}
