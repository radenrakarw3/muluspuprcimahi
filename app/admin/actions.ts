"use server";

/**
 * Server Actions untuk admin: Terima, Tolak, Duplikat, Selesai.
 * Semua aksi:
 *   - Verifikasi sesi admin.
 *   - Update `reports`.
 *   - Insert `report_status_history` (audit trail).
 *   - Kirim notifikasi WA via `notify()`.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  categories,
  reportPhotos,
  reports,
  reportStatusHistory,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { decryptWa } from "@/lib/encryption";
import { notify } from "@/lib/wa-notify";
import {
  adminAcceptSchema,
  adminDuplicateSchema,
  adminRejectSchema,
  adminResolveSchema,
} from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Tidak terautentikasi.");
  return session;
}

function appUrl(): string {
  return process.env.APP_URL ?? "";
}

async function loadReport(reportId: string) {
  const row = (
    await db
      .select({
        r: reports,
        cnama: categories.nama,
      })
      .from(reports)
      .innerJoin(categories, eq(categories.id, reports.categoryId))
      .where(eq(reports.id, reportId))
  )[0];
  if (!row) throw new Error("Laporan tidak ditemukan.");
  return row;
}

export async function acceptReport(input: { reportId: string }) {
  const session = await requireAdmin();
  const parsed = adminAcceptSchema.safeParse(input);
  if (!parsed.success) throw new Error("Input tidak valid.");
  const { reportId } = parsed.data;

  const { r, cnama } = await loadReport(reportId);
  if (r.status !== "baru") throw new Error("Hanya laporan 'baru' yang bisa diterima.");

  await db
    .update(reports)
    .set({ status: "diterima", updatedAt: new Date() })
    .where(eq(reports.id, reportId));

  await db.insert(reportStatusHistory).values({
    id: nanoid(16),
    reportId,
    fromStatus: r.status,
    toStatus: "diterima",
    changedByAdmin: session.user.id,
  });

  const wa = decryptWa(r.pelaporWaEnc);
  await notify({
    templateKey: "report_accepted",
    toWa: wa,
    reportId,
    vars: {
      nama: r.pelaporNama,
      kode_laporan: r.kode,
      kategori: cnama,
      url: `${appUrl()}/laporan/${r.kode}`,
    },
  });

  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath(`/admin`);
  revalidatePath(`/laporan/${r.kode}`);
}

export async function rejectReport(input: { reportId: string; alasan: string }) {
  const session = await requireAdmin();
  const parsed = adminRejectSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Input tidak valid");
  }
  const { reportId, alasan } = parsed.data;

  const { r } = await loadReport(reportId);
  if (!["baru", "diterima"].includes(r.status)) {
    throw new Error("Laporan tidak bisa ditolak dari status saat ini.");
  }

  await db
    .update(reports)
    .set({ status: "ditolak", rejectedReason: alasan, updatedAt: new Date() })
    .where(eq(reports.id, reportId));

  await db.insert(reportStatusHistory).values({
    id: nanoid(16),
    reportId,
    fromStatus: r.status,
    toStatus: "ditolak",
    alasan,
    changedByAdmin: session.user.id,
  });

  const wa = decryptWa(r.pelaporWaEnc);
  await notify({
    templateKey: "report_rejected",
    toWa: wa,
    reportId,
    vars: {
      nama: r.pelaporNama,
      kode_laporan: r.kode,
      alasan,
    },
  });

  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath(`/admin`);
  revalidatePath(`/laporan/${r.kode}`);
}

export async function duplicateReport(input: {
  reportId: string;
  parentReportId: string;
}) {
  const session = await requireAdmin();
  const parsed = adminDuplicateSchema.safeParse(input);
  if (!parsed.success) throw new Error("Input tidak valid.");
  const { reportId, parentReportId } = parsed.data;
  if (reportId === parentReportId) {
    throw new Error("Laporan tidak bisa di-merge ke dirinya sendiri.");
  }

  const { r } = await loadReport(reportId);
  const parent = (
    await db.select().from(reports).where(eq(reports.id, parentReportId))
  )[0];
  if (!parent) throw new Error("Laporan parent tidak ditemukan.");

  await db
    .update(reports)
    .set({
      status: "duplikat",
      parentReportId,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId));

  await db.insert(reportStatusHistory).values({
    id: nanoid(16),
    reportId,
    fromStatus: r.status,
    toStatus: "duplikat",
    alasan: `Digabung dengan ${parent.kode}`,
    changedByAdmin: session.user.id,
  });

  const wa = decryptWa(r.pelaporWaEnc);
  await notify({
    templateKey: "report_duplicate",
    toWa: wa,
    reportId,
    vars: {
      nama: r.pelaporNama,
      kode_laporan: r.kode,
      parent_kode: parent.kode,
      url: `${appUrl()}/laporan/${parent.kode}`,
    },
  });

  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath(`/admin`);
}

export async function resolveReport(input: {
  reportId: string;
  catatan: string;
  fotoAfterUrl: string;
}) {
  const session = await requireAdmin();
  const parsed = adminResolveSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Input tidak valid");
  }
  const { reportId, catatan, fotoAfterUrl } = parsed.data;

  const { r } = await loadReport(reportId);
  if (r.status !== "diterima") {
    throw new Error("Hanya laporan yang sudah 'diterima' bisa diselesaikan.");
  }

  await db
    .update(reports)
    .set({
      status: "selesai",
      resolvedNote: catatan,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId));

  await db.insert(reportPhotos).values({
    id: nanoid(16),
    reportId,
    url: fotoAfterUrl,
    kind: "after",
    uploadedByAdmin: session.user.id,
  });

  await db.insert(reportStatusHistory).values({
    id: nanoid(16),
    reportId,
    fromStatus: r.status,
    toStatus: "selesai",
    alasan: catatan,
    changedByAdmin: session.user.id,
    fotoAfterUrl,
  });

  const wa = decryptWa(r.pelaporWaEnc);
  await notify({
    templateKey: "report_resolved",
    toWa: wa,
    reportId,
    vars: {
      nama: r.pelaporNama,
      kode_laporan: r.kode,
      catatan,
      url: `${appUrl()}/laporan/${r.kode}`,
    },
  });

  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath(`/admin`);
  revalidatePath(`/laporan/${r.kode}`);
}
