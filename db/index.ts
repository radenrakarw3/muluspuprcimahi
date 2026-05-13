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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum di-set. Salin .env.example ke .env.local dan isi connection Neon Anda.",
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
