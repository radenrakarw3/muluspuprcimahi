/**
 * Skema Zod bersama (client + server).
 */
import { z } from "zod";

export const waSchema = z
  .string()
  .min(8, "Nomor terlalu pendek")
  .max(20, "Nomor terlalu panjang")
  .regex(/^[\d+\-\s]+$/, "Hanya angka diperbolehkan");

export const reportSubmitSchema = z.object({
  categorySlug: z.string().min(2).max(64),
  deskripsi: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(1000, "Deskripsi maksimal 1000 karakter"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  alamat: z.string().max(500).optional().nullable(),
  rw: z
    .string()
    .max(8)
    .regex(/^\d{0,3}$/, "RW hanya angka")
    .optional()
    .nullable(),
  rt: z
    .string()
    .max(8)
    .regex(/^\d{0,3}$/, "RT hanya angka")
    .optional()
    .nullable(),
  pelaporNama: z.string().min(2, "Nama terlalu pendek").max(128),
  pelaporWa: waSchema,
  otpCode: z.string().regex(/^\d{6}$/, "OTP harus 6 digit"),
  fotoKeys: z.array(z.string()).min(1, "Minimal 1 foto").max(3, "Maksimal 3 foto"),
  fotoUrls: z.array(z.string().url()).min(1).max(3),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Anda harus menyetujui kebijakan privasi" }),
  }),
  turnstileToken: z.string().optional(),
  parentReportId: z.string().optional().nullable(),
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
  catatan: z.string().min(5).max(500),
  fotoAfterUrl: z.string().url(),
});

export const adminDuplicateSchema = z.object({
  reportId: z.string(),
  parentReportId: z.string(),
});
