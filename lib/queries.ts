/**
 * Reusable read queries.
 */
import { and, desc, eq, gte, ilike, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  reportPhotos,
  reports,
  reportStatusHistory,
  supports,
  waMessageLog,
} from "@/db/schema";
import { normalizePublicReportKode } from "@/lib/report-code";
import type { ReportStatusValue } from "@/db/schema";

export type ListReportsFilter = {
  status?: ReportStatusValue[];
  categorySlugs?: string[];
  kecamatan?: string;
  q?: string;
  limit?: number;
};

export async function listReportsForMap(filter: ListReportsFilter = {}) {
  const conds = [] as ReturnType<typeof eq>[];
  if (filter.status && filter.status.length) {
    conds.push(inArray(reports.status, filter.status) as ReturnType<typeof eq>);
  }
  if (filter.categorySlugs && filter.categorySlugs.length) {
    conds.push(inArray(categories.slug, filter.categorySlugs) as ReturnType<typeof eq>);
  }
  if (filter.kecamatan) {
    conds.push(eq(reports.kecamatan, filter.kecamatan));
  }
  if (filter.q && filter.q.length > 1) {
    conds.push(ilike(reports.deskripsi, `%${filter.q}%`) as ReturnType<typeof eq>);
  }

  const rows = await db
    .select({
      id: reports.id,
      kode: reports.kode,
      lat: reports.lat,
      lng: reports.lng,
      status: reports.status,
      category_nama: categories.nama,
      category_slug: categories.slug,
      deskripsi: reports.deskripsi,
      created_at: reports.createdAt,
    })
    .from(reports)
    .innerJoin(categories, eq(categories.id, reports.categoryId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(filter.limit ?? 1000);

  return rows.map((r) => {
    const lat = parseFloat(String(r.lat).trim().replace(",", "."));
    const lng = parseFloat(String(r.lng).trim().replace(",", "."));
    return {
      ...r,
      lat,
      lng,
      created_at:
        r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  });
}

export async function getReportByKode(rawKode: string) {
  const kode = normalizePublicReportKode(rawKode);
  const r = (
    await db
      .select({
        id: reports.id,
        kode: reports.kode,
        status: reports.status,
        deskripsi: reports.deskripsi,
        lat: reports.lat,
        lng: reports.lng,
        alamat: reports.alamat,
        kecamatan: reports.kecamatan,
        kelurahan: reports.kelurahan,
        rw: reports.rw,
        rt: reports.rt,
        pelaporNama: reports.pelaporNama,
        dukunganCount: reports.dukunganCount,
        parentReportId: reports.parentReportId,
        rejectedReason: reports.rejectedReason,
        resolvedNote: reports.resolvedNote,
        resolvedAt: reports.resolvedAt,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        categorySlug: categories.slug,
        categoryNama: categories.nama,
        categoryBidang: categories.bidang,
      })
      .from(reports)
      .innerJoin(categories, eq(categories.id, reports.categoryId))
      .where(eq(reports.kode, kode))
  )[0];

  if (!r) return null;

  const photos = await db
    .select()
    .from(reportPhotos)
    .where(eq(reportPhotos.reportId, r.id))
    .orderBy(reportPhotos.createdAt);

  const history = await db
    .select()
    .from(reportStatusHistory)
    .where(eq(reportStatusHistory.reportId, r.id))
    .orderBy(reportStatusHistory.createdAt);

  return { ...r, photos, history, lat: Number(r.lat), lng: Number(r.lng) };
}

export async function getReportById(id: string) {
  const r = (await db.select().from(reports).where(eq(reports.id, id)))[0];
  if (!r) return null;
  return getReportByKode(r.kode);
}

export async function listCategories() {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.aktif, true))
    .orderBy(categories.urutan);
}

export async function reportsAdminStats() {
  const res = await db
    .select({ status: reports.status, count: sql<number>`count(*)::int` })
    .from(reports)
    .groupBy(reports.status);
  const out: Record<string, number> = {
    baru: 0,
    diterima: 0,
    selesai: 0,
    ditolak: 0,
    duplikat: 0,
  };
  for (const r of res) out[r.status] = r.count;
  return out;
}

export type ReportsAdminStats = Awaited<ReturnType<typeof reportsAdminStats>>;

/** Ringkasan untuk panel dashboard admin (MULUS). */
export type AdminDashboardInsights = {
  totalReports: number;
  /** Butuh tindakan: verifikasi atau penyelesaian. */
  needsAction: number;
  /** Laporan baru (created) dalam 7 hari. */
  reportsCreatedLast7Days: number;
  /** Laporan baru dalam 24 jam. */
  reportsCreatedLast24Hours: number;
  /** Perubahan status oleh sistem/admin dalam 7 hari (proxy aktivitas). */
  statusEventsLast7Days: number;
  /** Riwayat ke status selesai dalam 7 hari. */
  resolvedEventsLast7Days: number;
  categoryBreakdown: { nama: string; slug: string; count: number }[];
  kecamatanBreakdown: { nama: string; count: number }[];
  totalSupports: number;
  photosBefore: number;
  photosAfter: number;
  waPending: number;
  waFailedLast7Days: number;
};

export async function getAdminDashboardInsights(
  stats: ReportsAdminStats,
): Promise<AdminDashboardInsights> {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const dayAgo = new Date(Date.now() - 86400000);

  const totalReports =
    stats.baru + stats.diterima + stats.selesai + stats.ditolak + stats.duplikat;
  const needsAction = stats.baru + stats.diterima;

  const [
    created7,
    created24,
    statusEvents7,
    resolved7,
    categoryRows,
    kecamatanRows,
    supportsRow,
    photosBeforeRow,
    photosAfterRow,
    waPendingRow,
    waFailed7Row,
  ] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reports)
      .where(gte(reports.createdAt, weekAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reports)
      .where(gte(reports.createdAt, dayAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reportStatusHistory)
      .where(gte(reportStatusHistory.createdAt, weekAgo)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reportStatusHistory)
      .where(
        and(
          gte(reportStatusHistory.createdAt, weekAgo),
          eq(reportStatusHistory.toStatus, "selesai"),
        ),
      ),
    db
      .select({
        nama: categories.nama,
        slug: categories.slug,
        n: sql<number>`count(*)::int`,
      })
      .from(reports)
      .innerJoin(categories, eq(categories.id, reports.categoryId))
      .groupBy(categories.id, categories.nama, categories.slug),
    db
      .select({
        nama: reports.kecamatan,
        n: sql<number>`count(*)::int`,
      })
      .from(reports)
      .where(isNotNull(reports.kecamatan))
      .groupBy(reports.kecamatan),
    db.select({ c: sql<number>`count(*)::int` }).from(supports),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reportPhotos)
      .where(eq(reportPhotos.kind, "before")),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reportPhotos)
      .where(eq(reportPhotos.kind, "after")),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(waMessageLog)
      .where(eq(waMessageLog.status, "pending")),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(waMessageLog)
      .where(
        and(eq(waMessageLog.status, "failed"), gte(waMessageLog.createdAt, weekAgo)),
      ),
  ]);

  const categoryBreakdown = categoryRows
    .map((r) => ({ nama: r.nama, slug: r.slug, count: r.n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const kecamatanBreakdown = kecamatanRows
    .filter((r) => r.nama && String(r.nama).trim().length > 0)
    .map((r) => ({ nama: String(r.nama).trim(), count: r.n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalReports,
    needsAction,
    reportsCreatedLast7Days: created7[0]?.c ?? 0,
    reportsCreatedLast24Hours: created24[0]?.c ?? 0,
    statusEventsLast7Days: statusEvents7[0]?.c ?? 0,
    resolvedEventsLast7Days: resolved7[0]?.c ?? 0,
    categoryBreakdown,
    kecamatanBreakdown,
    totalSupports: supportsRow[0]?.c ?? 0,
    photosBefore: photosBeforeRow[0]?.c ?? 0,
    photosAfter: photosAfterRow[0]?.c ?? 0,
    waPending: waPendingRow[0]?.c ?? 0,
    waFailedLast7Days: waFailed7Row[0]?.c ?? 0,
  };
}
