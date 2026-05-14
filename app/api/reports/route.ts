/**
 * POST /api/reports — submit laporan warga.
 *
 * Alur:
 * 1. Validasi Zod & captcha.
 * 2. Verifikasi OTP terhadap nomor WA (baru ditandai used setelah simpan sukses).
 * 3. Cek geofencing (harus dalam boundary Cimahi).
 * 4. Cek rate limit harian.
 * 5. Kecamatan/kelurahan dari input warga (dropdown), sudah divalidasi Zod.
 * 6. Insert reports + photos + status_history (bila gagal, baris laporan dihapus).
 * 7. Kirim notifikasi "report_received" via Starsender.
 *
 * Bila `parentReportId` di-set, ini bukan laporan baru melainkan dukungan
 * terhadap laporan eksisting -> insert ke `report_supports`.
 */
import { NextResponse } from "next/server";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  reportPhotos,
  reports,
  reportStatusHistory,
  supports,
  waOtp,
} from "@/db/schema";
import {
  encryptWa,
  hashIp,
  hashOtp,
  hashWa,
  isValidIdWa,
  normalizeWa,
} from "@/lib/encryption";
import { isInsideCimahi } from "@/lib/geo";
import { rateLimitWaDaily } from "@/lib/rate-limit";
import { reportSubmitSchema } from "@/lib/validation";
import { notify } from "@/lib/wa-notify";
import { categories } from "@/db/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { randomInt } from "node:crypto";

export const runtime = "nodejs";

function randomReportCode7(): string {
  return String(randomInt(0, 10_000_000)).padStart(7, "0");
}

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reportSubmitSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.fotoUrls?.[0] ??
      parsed.error.flatten().fieldErrors.fotoKeys?.[0] ??
      parsed.error.errors[0]?.message ??
      "Input tidak valid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const data = parsed.data;

  if (!isValidIdWa(data.pelaporWa)) {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak valid." },
      { status: 400 },
    );
  }

  if (data.turnstileToken) {
    const ok = await verifyTurnstile(data.turnstileToken, getIp(req));
    if (!ok) {
      return NextResponse.json({ error: "Verifikasi captcha gagal." }, { status: 400 });
    }
  }

  // Geofencing
  const inside = await isInsideCimahi(data.lat, data.lng);
  if (!inside) {
    return NextResponse.json(
      { error: "Titik di luar wilayah Kota Cimahi." },
      { status: 400 },
    );
  }

  const wa = normalizeWa(data.pelaporWa);
  const waHash = hashWa(wa);

  // OTP verification (dan tandai used)
  const otp = await db
    .select()
    .from(waOtp)
    .where(
      and(
        eq(waOtp.waHash, waHash),
        eq(waOtp.codeHash, hashOtp(data.otpCode)),
        gt(waOtp.expiresAt, new Date()),
        isNull(waOtp.usedAt),
      ),
    )
    .orderBy(desc(waOtp.createdAt))
    .limit(1);
  if (otp.length === 0) {
    return NextResponse.json(
      { error: "OTP tidak valid atau kadaluarsa. Minta kode baru." },
      { status: 400 },
    );
  }
  const otpId = otp[0].id;

  // Rate limit
  const rl = await rateLimitWaDaily(waHash);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Nomor ini sudah membuat ${rl.current} laporan hari ini (batas ${rl.limit}). Coba lagi besok.`,
      },
      { status: 429 },
    );
  }

  // Cari category id
  const cat = (
    await db.select().from(categories).where(eq(categories.slug, data.categorySlug))
  )[0];
  if (!cat) {
    return NextResponse.json({ error: "Kategori tidak dikenal." }, { status: 400 });
  }

  // Branch: support laporan eksisting
  if (data.parentReportId) {
    const parent = (
      await db.select().from(reports).where(eq(reports.id, data.parentReportId))
    )[0];
    if (!parent) {
      return NextResponse.json(
        { error: "Laporan asal tidak ditemukan." },
        { status: 404 },
      );
    }
    const insertedSupport = await db
      .insert(supports)
      .values({ reportId: parent.id, waHash })
      .onConflictDoNothing()
      .returning({ reportId: supports.reportId });
    // Hanya naikkan counter bila baris dukungan baru benar-benar tercatat (bukan duplikat WA yang sama).
    if (insertedSupport.length > 0) {
      await db
        .update(reports)
        .set({ dukunganCount: sql`${reports.dukunganCount} + 1` })
        .where(eq(reports.id, parent.id));
    }
    await db.update(waOtp).set({ usedAt: new Date() }).where(eq(waOtp.id, otpId));
    return NextResponse.json({ ok: true, kode: parent.kode, supported: true });
  }

  // Insert laporan baru — nomor 7 digit acak, pastikan unik di DB
  const id = nanoid(16);
  let kode = "";
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = randomReportCode7();
    const clash = await db.select({ id: reports.id }).from(reports).where(eq(reports.kode, candidate)).limit(1);
    if (clash.length === 0) {
      kode = candidate;
      break;
    }
  }
  if (!kode) {
    return NextResponse.json(
      { error: "Gagal membuat nomor laporan. Silakan coba lagi sebentar lagi." },
      { status: 503 },
    );
  }
  const ipHash = hashIp(getIp(req));

  try {
    // Insert raw SQL untuk geom (Drizzle belum native untuk geometry).
    await db.execute(sql`
      INSERT INTO reports (
        id, kode, category_id, deskripsi, status, lat, lng, geom,
        alamat, kecamatan, kelurahan, rw, rt,
        pelapor_nama, pelapor_wa_hash, pelapor_wa_enc, ip_hash, created_at, updated_at
      ) VALUES (
        ${id}, ${kode}, ${cat.id}, ${data.deskripsi}, 'baru', ${String(data.lat)}, ${String(data.lng)},
        ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326),
        ${data.alamat ?? null}, ${data.kecamatan}, ${data.kelurahan},
        ${data.rw}, ${data.rt},
        ${data.pelaporNama}, ${waHash}, ${encryptWa(wa)}, ${ipHash}, now(), now()
      )
    `);

    for (const url of data.fotoUrls) {
      await db.insert(reportPhotos).values({
        id: nanoid(16),
        reportId: id,
        url,
        kind: "before",
      });
    }

    await db.insert(reportStatusHistory).values({
      id: nanoid(16),
      reportId: id,
      fromStatus: null,
      toStatus: "baru",
      alasan: "Laporan masuk dari warga",
    });
  } catch (e) {
    console.error("[reports POST] simpan DB gagal:", e);
    await db.delete(reports).where(eq(reports.id, id));
    return NextResponse.json(
      { error: "Gagal menyimpan laporan ke basis data. Silakan coba lagi." },
      { status: 500 },
    );
  }

  await db.update(waOtp).set({ usedAt: new Date() }).where(eq(waOtp.id, otpId));

  // Notifikasi konfirmasi ke warga
  const appUrl = process.env.APP_URL ?? "";
  await notify({
    templateKey: "report_received",
    toWa: wa,
    reportId: id,
    vars: {
      nama: data.pelaporNama,
      kode_laporan: kode,
      url: appUrl ? `${appUrl}/laporan/${kode}` : `/laporan/${kode}`,
    },
  });

  return NextResponse.json({ ok: true, kode, id });
}
