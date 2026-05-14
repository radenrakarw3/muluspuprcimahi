/**
 * Normalisasi kode laporan dari URL / form.
 * - Format legacy `CMH-YYYYMM-XXXX` tetap dipakai apa adanya (uppercase).
 * - Nomor baru: hanya angka, dijadikan tepat 7 digit (padding nol di depan bila perlu).
 */
export function normalizePublicReportKode(raw: string): string {
  const s = raw.trim();
  const up = s.toUpperCase();
  if (up.startsWith("CMH-")) return up;
  const d = s.replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d.length <= 7) return d.padStart(7, "0");
  return d.slice(0, 7);
}
