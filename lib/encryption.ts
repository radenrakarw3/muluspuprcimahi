/**
 * Enkripsi AES-256-GCM untuk nomor WA pelapor.
 *
 * - Nomor WA tidak boleh disimpan plaintext (privasi UU PDP 27/2022).
 * - Untuk pencarian/dedup, gunakan `hashWa()` (one-way SHA-256 + salt aplikasi).
 * - Untuk mengirim WA, gunakan `decryptWa()` (admin server only).
 *
 * Key berasal dari env `ENCRYPTION_KEY` (base64, 32 byte).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY belum di-set.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY harus 32 byte (base64 dari `openssl rand -base64 32`).");
  }
  return key;
}

export function encryptWa(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: base64(iv | tag | ciphertext)
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptWa(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

/**
 * Hash satu arah dengan pepper aplikasi.
 * Dipakai untuk dedup & rate limit tanpa mengekspos nomor.
 */
export function hashWa(wa: string): string {
  const pepper = process.env.ENCRYPTION_KEY ?? "no-pepper";
  return createHash("sha256").update(`${pepper}:${normalizeWa(wa)}`).digest("hex");
}

export function hashIp(ip: string): string {
  const pepper = process.env.ENCRYPTION_KEY ?? "no-pepper";
  return createHash("sha256").update(`${pepper}:ip:${ip}`).digest("hex");
}

/**
 * Normalisasi nomor WA ke format E.164 tanpa tanda plus.
 * Contoh input: "08123456789", "+62 812 3456 789", "62812-3456-789"
 * Output:        "628123456789"
 */
export function normalizeWa(input: string): string {
  let s = input.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("0")) s = "62" + s.slice(1);
  if (s.startsWith("8")) s = "62" + s;
  return s;
}

export function isValidIdWa(input: string): boolean {
  const n = normalizeWa(input);
  // 62 + 8xxxxxxxxx (10-13 angka setelah 8)
  return /^628\d{8,11}$/.test(n);
}

export function generateOtpCode(): string {
  // 6 digit, tanpa awalan 0 supaya lebih nyaman dibaca
  const n = 100000 + Math.floor(Math.random() * 900000);
  return n.toString();
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(`otp:${code}`).digest("hex");
}
