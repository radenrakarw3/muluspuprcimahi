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

/** Hanya kombinasi biru tua + kuning (tanpa putih/hijau/merah netral). */
export const STATUS_COLOR: Record<ReportStatusValue, string> = {
  baru: "bg-[hsl(220,58%,18%)] text-[hsl(48,96%,58%)] border-[hsl(48,90%,48%)]",
  diterima: "bg-[hsl(220,52%,26%)] text-[hsl(48,100%,55%)] border-[hsl(48,95%,52%)]",
  ditolak: "bg-[hsl(48,100%,42%)] text-[hsl(220,78%,11%)] border-[hsl(220,65%,22%)]",
  duplikat: "bg-[hsl(48,96%,48%)] text-[hsl(220,78%,11%)] border-[hsl(220,58%,20%)]",
  selesai: "bg-[hsl(220,48%,30%)] text-[hsl(48,100%,58%)] border-[hsl(48,90%,50%)]",
};

/**
 * Warna pin peta: merah = baru, biru = diterima, hijau = selesai.
 * Status lain: abu & amber agar tidak bentrok dengan tiga utama.
 */
export const STATUS_PIN_COLOR: Record<ReportStatusValue, string> = {
  baru: "#dc2626",
  diterima: "#2563eb",
  ditolak: "#6b7280",
  duplikat: "#d97706",
  selesai: "#16a34a",
};
