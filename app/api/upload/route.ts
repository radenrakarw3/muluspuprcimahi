/**
 * POST /api/upload
 *   { contentType, reportKode? }
 * -> { uploadUrl, publicUrl, key }
 *
 * Client lalu PUT langsung file ke `uploadUrl` (R2 presigned).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { presignPhotoUpload } from "@/lib/storage";

export const runtime = "nodejs";

const schema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  reportKode: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "contentType harus image/jpeg, image/png, atau image/webp." },
      { status: 400 },
    );
  }
  try {
    const result = await presignPhotoUpload(parsed.data.contentType, parsed.data.reportKode);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage error" },
      { status: 500 },
    );
  }
}
