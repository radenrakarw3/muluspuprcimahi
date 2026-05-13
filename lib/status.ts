import type { ReportStatusValue } from "@/db/schema";

export const STATUS_LABEL: Record<ReportStatusValue, string> = {
  baru: "Baru / Menunggu Verifikasi",
  diterima: "Diterima",
  ditolak: "Ditolak",
  duplikat: "Digabung",
  selesai: "Selesai",
};

export const STATUS_SHORT: Record<ReportStatusValue, string> = {
  baru: "Baru",
  diterima: "Diterima",
  ditolak: "Ditolak",
  duplikat: "Digabung",
  selesai: "Selesai",
};

export const STATUS_COLOR: Record<ReportStatusValue, string> = {
  baru: "bg-slate-100 text-slate-800 border-slate-200",
  diterima: "bg-blue-100 text-blue-800 border-blue-200",
  ditolak: "bg-rose-100 text-rose-800 border-rose-200",
  duplikat: "bg-amber-100 text-amber-800 border-amber-200",
  selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const STATUS_PIN_COLOR: Record<ReportStatusValue, string> = {
  baru: "#64748b",
  diterima: "#2563eb",
  ditolak: "#e11d48",
  duplikat: "#d97706",
  selesai: "#059669",
};
