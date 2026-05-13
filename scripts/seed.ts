/**
 * Seed data awal: kategori, region (3 kecamatan + 15 kelurahan + kota),
 * template WA, dan satu super admin.
 *
 * Jalankan: `pnpm db:seed`
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { sql as dsql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as schema from "../db/schema";
import { CATEGORIES, REGIONS, WA_TEMPLATES } from "../db/seed-data";

function bboxToMultiPolygonWKT([minLng, minLat, maxLng, maxLat]: [
  number,
  number,
  number,
  number,
]): string {
  return `MULTIPOLYGON(((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat})))`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemukan.");
  const conn = neon(url);
  const db = drizzle(conn, { schema });

  console.log("• Seed categories...");
  for (const c of CATEGORIES) {
    await db
      .insert(schema.categories)
      .values({ id: nanoid(16), ...c })
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: {
          nama: c.nama,
          ikon: c.ikon,
          deskripsi: c.deskripsi,
          bidang: c.bidang,
          urutan: c.urutan,
        },
      });
  }
  console.log(`  ✓ ${CATEGORIES.length} kategori`);

  console.log("• Seed regions (kota, kecamatan, kelurahan)...");
  for (const r of REGIONS) {
    const wkt = bboxToMultiPolygonWKT(r.bbox);
    // INSERT manual karena Drizzle belum mengirim WKT sebagai geometry secara otomatis.
    await conn`
      INSERT INTO regions (id, level, kode, nama, parent_kode, geom)
      VALUES (
        ${nanoid(16)},
        ${r.level}::region_level,
        ${r.kode},
        ${r.nama},
        ${r.parentKode},
        ST_Multi(ST_GeomFromText(${wkt}, 4326))
      )
      ON CONFLICT (kode) DO UPDATE
        SET nama = EXCLUDED.nama,
            parent_kode = EXCLUDED.parent_kode,
            geom = EXCLUDED.geom
    `;
  }
  console.log(`  ✓ ${REGIONS.length} region`);

  console.log("• Seed WA templates...");
  for (const t of WA_TEMPLATES) {
    await db
      .insert(schema.waTemplates)
      .values(t)
      .onConflictDoUpdate({
        target: schema.waTemplates.key,
        set: { nama: t.nama, body: t.body, variables: t.variables },
      });
  }
  console.log(`  ✓ ${WA_TEMPLATES.length} template`);

  console.log("• Seed super admin...");
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pupr.cimahikota.go.id";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "PuprCimahi2026!";
  const existing = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email));
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(schema.adminUsers).values({
      id: nanoid(16),
      email,
      passwordHash,
      nama: "Super Admin PUPR",
      role: "super_admin",
      aktif: true,
    });
    console.log(`  ✓ Super admin dibuat: ${email} / ${password}`);
    console.log("    ⚠ GANTI password ini setelah login pertama!");
  } else {
    console.log(`  • Super admin sudah ada (${email}), dilewati.`);
  }

  console.log("\n✓ Seed selesai.");
  void dsql;
}

main().catch((err) => {
  console.error("✗ Seed gagal:", err);
  process.exit(1);
});
