import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Lazy-initialize Drizzle client agar tidak meledak saat build time
 * (build kadang me-load route handler tanpa env DB).
 */
type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

function makeDb(): DB {
  // Neon / Railway / Vercel kadang pakai nama variabel berbeda
  const connectionString = (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    ""
  ).trim();
  if (!connectionString) {
    throw new Error(
      [
        "DATABASE_URL belum diisi (atah hanya kutip kosong).",
        "",
        "1) Buka https://console.neon.tech → project Anda → Connection details",
        "2) Pilih tab \"Pooled\" / connection string dengan -pooler. di host",
        "3) Di root proyek, buat/edit .env.local (disarankan) atau .env dengan:",
        '   DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"',
        "",
        "Hapus baris DATABASE_URL=\"\" jika ada — string kosong tidak dihitung valid.",
      ].join("\n"),
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema, logger: process.env.NODE_ENV !== "production" });
}

/**
 * Proxy lazy: koneksi DB baru dibuat ketika method pertama kali dipanggil.
 */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    if (!_db) _db = makeDb();
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(_db) : value;
  },
});

export { schema };
