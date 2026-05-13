/**
 * Retry pesan WA yang gagal terkirim (status='failed' & retry_count<3).
 * Jadwalkan via Railway Cron / pg_cron / GitHub Actions cron tiap 5 menit:
 *   pnpm wa:retry
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, lt } from "drizzle-orm";
import * as schema from "../db/schema";
import { sendWa } from "../lib/starsender";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemukan.");
  const conn = neon(url);
  const db = drizzle(conn, { schema });

  const MAX_RETRY = 3;

  const pending = await db
    .select()
    .from(schema.waMessageLog)
    .where(
      and(
        eq(schema.waMessageLog.status, "failed"),
        lt(schema.waMessageLog.retryCount, MAX_RETRY),
      ),
    )
    .limit(50);

  if (pending.length === 0) {
    console.log("• Tidak ada pesan untuk dicoba ulang.");
    return;
  }

  console.log(`• Mencoba ulang ${pending.length} pesan...`);

  for (const msg of pending) {
    const res = await sendWa(msg.toWa, msg.body);
    await db
      .update(schema.waMessageLog)
      .set({
        status: res.ok ? "sent" : "failed",
        retryCount: msg.retryCount + 1,
        starsenderId: res.id ?? msg.starsenderId,
        lastError: res.error ?? null,
        sentAt: res.ok ? new Date() : null,
      })
      .where(eq(schema.waMessageLog.id, msg.id));
    console.log(`  ${res.ok ? "✓" : "✗"} ${msg.toWa} (${msg.templateKey})`);
  }

  console.log("✓ Retry selesai.");
}

main().catch((err) => {
  console.error("✗ Retry gagal:", err);
  process.exit(1);
});
