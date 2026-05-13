/**
 * High-level helper untuk mengirim notifikasi WA terkait laporan.
 * Mengambil template dari DB, render variabel, log ke `wa_message_log`, lalu kirim.
 *
 * Dipanggil dari Server Actions admin (Terima/Tolak/Selesai/Duplikat) dan dari
 * flow submit laporan warga.
 */
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { waMessageLog, waTemplates, type WaTemplate } from "@/db/schema";
import { renderTemplate, sendWa } from "@/lib/starsender";

export type NotifyResult = { ok: boolean; logId: string; error?: string };

export async function notify(opts: {
  templateKey: string;
  toWa: string;
  vars: Record<string, string | number | undefined>;
  reportId?: string;
}): Promise<NotifyResult> {
  const tpl: WaTemplate | undefined = (
    await db.select().from(waTemplates).where(eq(waTemplates.key, opts.templateKey))
  )[0];

  if (!tpl) {
    return {
      ok: false,
      logId: "",
      error: `Template '${opts.templateKey}' tidak ditemukan.`,
    };
  }

  const body = renderTemplate(tpl.body, opts.vars);
  const logId = nanoid(16);

  await db.insert(waMessageLog).values({
    id: logId,
    reportId: opts.reportId ?? null,
    templateKey: opts.templateKey,
    toWa: opts.toWa,
    body,
    status: "pending",
  });

  const res = await sendWa(opts.toWa, body);

  await db
    .update(waMessageLog)
    .set({
      status: res.ok ? "sent" : "failed",
      starsenderId: res.id ?? null,
      lastError: res.error ?? null,
      sentAt: res.ok ? new Date() : null,
    })
    .where(eq(waMessageLog.id, logId));

  return { ok: res.ok, logId, error: res.error };
}
