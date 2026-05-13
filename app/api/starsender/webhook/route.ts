/**
 * Webhook Starsender inbound (BALASAN warga).
 *
 * Fase 1: hanya melog pesan masuk supaya tim PUPR bisa lihat di Starsender dashboard.
 * Fase 2: parse balasan "YA / TIDAK" untuk konfirmasi penyelesaian.
 *
 * Catatan keamanan: Starsender belum standar untuk signed webhook. Pakai
 * shared secret di query string sebagai mitigasi sederhana:
 *   POST /api/starsender/webhook?key=...
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const expected = process.env.STARSENDER_WEBHOOK_SECRET;
  if (expected && key !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    console.info("[starsender:webhook]", JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[starsender:webhook:error]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
