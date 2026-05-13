/**
 * Reusable read queries.
 */
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, reportPhotos, reports, reportStatusHistory } from "@/db/schema";
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

  return rows.map((r) => ({
    ...r,
    lat: Number(r.lat),
    lng: Number(r.lng),
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}

export async function getReportByKode(kode: string) {
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
