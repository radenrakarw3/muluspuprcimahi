/**
 * Rate limiter sederhana berbasis tabel Postgres (cocok untuk Neon serverless,
 * tanpa Redis tambahan).
 *
 * - `rateLimitWaDaily`: maks N laporan / nomor WA / hari.
 * - `rateLimitOtpCooldown`: minimal 60 detik antar permintaan OTP per nomor.
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports, waOtp } from "@/db/schema";

export async function countReportsToday(waHash: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const res = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.pelaporWaHash, waHash), gte(reports.createdAt, start)));
  return res[0]?.count ?? 0;
}

export async function rateLimitWaDaily(waHash: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const limit = Number(process.env.DAILY_REPORT_LIMIT_PER_WA ?? 3);
  const current = await countReportsToday(waHash);
  return { allowed: current < limit, current, limit };
}

export async function lastOtpRequestAt(waHash: string): Promise<Date | null> {
  const res = await db
    .select({ createdAt: waOtp.createdAt })
    .from(waOtp)
    .where(eq(waOtp.waHash, waHash))
    .orderBy(sql`${waOtp.createdAt} desc`)
    .limit(1);
  return res[0]?.createdAt ?? null;
}

export async function otpCooldownSeconds(waHash: string): Promise<number> {
  const COOLDOWN = 60;
  const last = await lastOtpRequestAt(waHash);
  if (!last) return 0;
  const elapsed = (Date.now() - last.getTime()) / 1000;
  return Math.max(0, Math.ceil(COOLDOWN - elapsed));
}
