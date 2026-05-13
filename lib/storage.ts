/**
 * Storage adapter untuk foto laporan.
 *
 * Default: Cloudflare R2 (S3-compatible). Bila env R2 belum di-set,
 * fallback ke "file lokal" mode (development saja: file disimpan di /public/uploads).
 *
 * Untuk upload dari browser, kita pakai presigned PUT URL agar foto tidak
 * melewati server Next.js (hemat memory & bandwidth).
 */
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET ?? "pupr-cimahi-photos";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export function isStorageConfigured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY);
}

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("R2 belum dikonfigurasi (cek env R2_*).");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY!,
      secretAccessKey: SECRET_KEY!,
    },
  });
}

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export async function presignPhotoUpload(
  contentType: string,
  reportKode?: string,
): Promise<PresignedUpload> {
  const ext = mimeToExt(contentType);
  const folder = reportKode ?? "tmp";
  const key = `reports/${folder}/${nanoid(20)}.${ext}`;

  if (!isStorageConfigured()) {
    // Fallback dev: arahkan ke endpoint internal /api/upload-local (sederhana)
    return {
      key,
      uploadUrl: `/api/upload-local?key=${encodeURIComponent(key)}`,
      publicUrl: `/uploads/${key}`,
    };
  }

  const client = getClient();
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 300 });
  const publicUrl = `${PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return { key, uploadUrl, publicUrl };
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
