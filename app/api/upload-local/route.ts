/**
 * Fallback upload lokal untuk mode dev (R2 belum dikonfigurasi).
 * JANGAN dipakai di production — file ditulis ke /public/uploads.
 */
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 400 });
  }
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const buf = Buffer.from(await req.arrayBuffer());
  const dest = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return NextResponse.json({ ok: true });
}
