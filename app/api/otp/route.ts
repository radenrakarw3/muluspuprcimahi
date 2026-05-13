/**
 * POST /api/otp
 *   action: "request"  -> kirim OTP ke nomor WA pelapor
 *   action: "verify"   -> verifikasi kode (tidak menghapus, biar bisa dipakai submit)
 */
import { NextResponse } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { waOtp } from "@/db/schema";
import {
  generateOtpCode,
  hashIp,
  hashOtp,
  hashWa,
  isValidIdWa,
  normalizeWa,
} from "@/lib/encryption";
import { otpCooldownSeconds, rateLimitWaDaily } from "@/lib/rate-limit";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validation";
import { notify } from "@/lib/wa-notify";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const action = (body as { action?: string }).action;

  if (action === "request") {
    return requestOtp(body, req);
  }
  if (action === "verify") {
    return verifyOtp(body);
  }
  return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
}

async function requestOtp(body: unknown, req: Request) {
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 },
    );
  }
  const { pelaporWa, turnstileToken } = parsed.data;

  if (!isValidIdWa(pelaporWa)) {
    return NextResponse.json(
      { error: "Nomor WhatsApp Indonesia tidak valid (contoh: 08123...)." },
      { status: 400 },
    );
  }

  if (turnstileToken !== undefined) {
    const ok = await verifyTurnstile(turnstileToken, getIp(req));
    if (!ok) {
      return NextResponse.json({ error: "Verifikasi captcha gagal." }, { status: 400 });
    }
  }

  const wa = normalizeWa(pelaporWa);
  const waHash = hashWa(wa);

  // Daily limit (cegah spam OTP)
  const rl = await rateLimitWaDaily(waHash);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Nomor ini sudah mencapai batas ${rl.limit} laporan hari ini. Coba lagi besok.`,
      },
      { status: 429 },
    );
  }

  const cooldown = await otpCooldownSeconds(waHash);
  if (cooldown > 0) {
    return NextResponse.json(
      { error: `Tunggu ${cooldown} detik sebelum minta OTP lagi.`, cooldown },
      { status: 429 },
    );
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  await db.insert(waOtp).values({
    id: nanoid(16),
    waHash,
    codeHash: hashOtp(code),
    expiresAt,
    ipHash: hashIp(getIp(req)),
  });

  const result = await notify({
    templateKey: "otp",
    toWa: wa,
    vars: { kode: code },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "Gagal mengirim OTP via WhatsApp. Pastikan nomor sudah terdaftar di WhatsApp.",
        detail: result.error,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, expiresInSec: 300 });
}

async function verifyOtp(body: unknown) {
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Input tidak valid" },
      { status: 400 },
    );
  }
  const { pelaporWa, code } = parsed.data;
  const waHash = hashWa(normalizeWa(pelaporWa));
  const codeHash = hashOtp(code);

  const valid = await db
    .select()
    .from(waOtp)
    .where(
      and(
        eq(waOtp.waHash, waHash),
        eq(waOtp.codeHash, codeHash),
        gt(waOtp.expiresAt, new Date()),
        isNull(waOtp.usedAt),
      ),
    )
    .orderBy(desc(waOtp.createdAt))
    .limit(1);

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "Kode OTP salah atau sudah kadaluarsa." },
      { status: 400 },
    );
  }

  // Tidak men-set `usedAt` di sini agar bisa dipakai ulang di submit.
  // Submit yang akan menandai sebagai used.
  return NextResponse.json({ ok: true });
}
