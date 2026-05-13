/**
 * Migrasi & inisialisasi database.
 * Menjalankan: `pnpm db:migrate` (setelah `pnpm db:generate`).
 *
 * Skrip ini:
 * 1. Mengaktifkan ekstensi PostGIS.
 * 2. Menjalankan SQL migration dari folder ./db/migrations.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemukan.");
  const sql = neon(url);

  console.log("• Mengaktifkan ekstensi PostGIS...");
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
  console.log("  PostGIS OK");

  const db = drizzle(sql);
  console.log("• Menjalankan migrasi Drizzle...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("✓ Migrasi selesai.");
}

main().catch((err) => {
  console.error("✗ Migrasi gagal:", err);
  process.exit(1);
});
