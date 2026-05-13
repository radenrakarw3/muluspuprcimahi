/**
 * Wrapper Starsender WA Gateway.
 *
 * Dokumentasi resmi: https://docs.starsender.online (versi mungkin berubah).
 * Endpoint utama yang dipakai di MVP: kirim pesan teks.
 *
 * Catatan:
 * - Semua kirim dicatat ke `wa_message_log` SEBELUM dipanggil, lalu
 *   statusnya di-update setelah respons.
 * - Bila gagal, scheduler `scripts/wa-retry.ts` akan mencoba lagi.
 */

const BASE = process.env.STARSENDER_BASE_URL ?? "https://api.starsender.online/api";

export type StarsenderSendResult = {
  ok: boolean;
  id?: string;
  status?: number;
  raw?: unknown;
  error?: string;
};

export async function sendWa(
  toE164: string,
  body: string,
): Promise<StarsenderSendResult> {
  const apiKey = process.env.STARSENDER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "STARSENDER_API_KEY belum di-set." };
  }

  // Starsender umumnya menerima nomor format 628xxx (tanpa +).
  const tujuan = toE164.replace(/^\+/, "");

  try {
    const res = await fetch(`${BASE}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        messageType: "text",
        to: tujuan,
        body,
        // Opsional: spesifikkan device tertentu kalau akun multi-device.
        ...(process.env.STARSENDER_DEVICE_ID
          ? { device: process.env.STARSENDER_DEVICE_ID }
          : {}),
      }),
    });

    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        raw,
        error: (raw as { message?: string })?.message ?? `HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      raw,
      id:
        (raw as { id?: string; data?: { id?: string } })?.id ??
        (raw as { data?: { id?: string } })?.data?.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Render template Starsender dengan variabel `{nama}` -> nilai.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}
