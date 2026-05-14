/**
 * Helper geo untuk query PostGIS.
 *
 * - `findRegionContaining`: ambil kecamatan & kelurahan dari titik lat/lng
 *   (auto-fill alamat di form lapor).
 * - `isInsideCimahi`: validasi geofencing.
 * - `findNearbyActiveReports`: cek duplikat radius.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type RegionMatch = {
  kecamatan?: string;
  kelurahan?: string;
  kecamatan_kode?: string;
  kelurahan_kode?: string;
};

export async function findRegionContaining(
  lat: number,
  lng: number,
): Promise<RegionMatch> {
  const rows = (await db.execute(sql`
    SELECT level, kode, nama
      FROM regions
     WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
  `)) as unknown as { rows: Array<{ level: string; kode: string; nama: string }> };

  const r = rows.rows ?? (rows as unknown as Array<{ level: string; kode: string; nama: string }>);
  const out: RegionMatch = {};
  for (const row of r) {
    if (row.level === "kecamatan") {
      out.kecamatan = row.nama;
      out.kecamatan_kode = row.kode;
    } else if (row.level === "kelurahan") {
      out.kelurahan = row.nama;
      out.kelurahan_kode = row.kode;
    }
  }
  return out;
}

export async function isInsideCimahi(lat: number, lng: number): Promise<boolean> {
  const res = (await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM regions
       WHERE level = 'kota'
         AND ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    ) AS inside
  `)) as unknown as { rows: Array<{ inside: boolean }> };
  const r = res.rows ?? (res as unknown as Array<{ inside: boolean }>);
  return Boolean(r[0]?.inside);
}

export type NearbyReport = {
  id: string;
  kode: string;
  status: string;
  category_slug: string;
  category_nama: string;
  deskripsi: string;
  jarak_meter: number;
  dukungan_count: number;
  created_at: string;
};

export async function findNearbyActiveReports(
  lat: number,
  lng: number,
  categorySlug: string,
  radiusMeters = Number(process.env.DUPLICATE_RADIUS_METERS ?? 75),
): Promise<NearbyReport[]> {
  const res = (await db.execute(sql`
    SELECT
      r.id,
      r.kode,
      r.status::text AS status,
      c.slug AS category_slug,
      c.nama AS category_nama,
      r.deskripsi,
      r.dukungan_count,
      r.created_at,
      ST_Distance(
        r.geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS jarak_meter
    FROM reports r
    JOIN categories c ON c.id = r.category_id
    WHERE c.slug = ${categorySlug}
      AND r.status IN ('baru','diterima')
      AND ST_DWithin(
        r.geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY jarak_meter ASC
    LIMIT 5
  `)) as unknown as { rows: NearbyReport[] };
  return res.rows ?? (res as unknown as NearbyReport[]);
}

