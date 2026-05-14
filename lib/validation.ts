/**
 * Skema Zod bersama (client + server).
 */
import { z } from "zod";
import { isValidWilayah } from "@/lib/cimahi-wilayah";

/** URL foto absolut (R2/CDN) atau path lokal `/uploads/...` (mode dev tanpa R2). */
export const storedPhotoUrlSchema = z
  .string()
  .min(4)
  .refine(
    (s) => z.string().url().safeParse(s).success || /^\/uploads\/[\w\-./]+$/i.test(s),
    "URL foto tidak valid",
  );

/** RT & RW wajib: angka 1–40 (tanpa nol di depan). */
function rtRwField(label: string) {
  return z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? "" : String(val).trim()),
    z.string().regex(/^(?:[1-9]|[12][0-9]|3[0-9]|40)$/, `${label} wajib (pilih 1–40)`),
  );
}

export const waSchema = z
  .string()
  .min(8, "Nomor terlalu pendek")
  .max(20, "Nomor terlalu panjang")
  .regex(/^[\d+\-\s]+$/, "Hanya angka diperbolehkan");

export const reportSubmitSchema = z
  .object({
    categorySlug: z.string().min(2).max(64),
    deskripsi: z
      .string()
      .min(10, "Deskripsi minimal 10 karakter")
      .max(1000, "Deskripsi maksimal 1000 karakter"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    kecamatan: z.string().min(2, "Pilih kecamatan").max(128),
    kelurahan: z.string().min(2, "Pilih kelurahan").max(128),
    alamat: z.string().max(500).optional().nullable(),
    rw: rtRwField("RW"),
    rt: rtRwField("RT"),
    pelaporNama: z.string().min(2, "Nama terlalu pendek").max(128),
    pelaporWa: waSchema,
    otpCode: z.string().regex(/^\d{6}$/, "OTP harus 6 digit"),
    fotoKeys: z.array(z.string()).min(1, "Minimal 1 foto").max(3, "Maksimal 3 foto"),
    fotoUrls: z.array(storedPhotoUrlSchema).min(1).max(3),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Anda harus menyetujui kebijakan privasi" }),
    }),
    turnstileToken: z.string().optional(),
    parentReportId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!isValidWilayah(data.kecamatan, data.kelurahan)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kombinasi kecamatan dan kelurahan tidak valid.",
        path: ["kelurahan"],
      });
    }
  });

export type ReportSubmitInput = z.infer<typeof reportSubmitSchema>;

export const otpRequestSchema = z.object({
  pelaporWa: waSchema,
  turnstileToken: z.string().optional(),
});

export const otpVerifySchema = z.object({
  pelaporWa: waSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const adminAcceptSchema = z.object({
  reportId: z.string(),
});

export const adminRejectSchema = z.object({
  reportId: z.string(),
  alasan: z.string().min(5, "Alasan minimal 5 karakter").max(500),
});

export const adminResolveSchema = z.object({
  reportId: z.string(),
  catatan: z.string().min(5, "Catatan minimal 5 karakter").max(500),
  fotoAfterUrl: storedPhotoUrlSchema,
});

export const adminDuplicateSchema = z.object({
  reportId: z.string(),
  parentReportId: z.string(),
});
