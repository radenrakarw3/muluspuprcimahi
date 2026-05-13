# Lapor PUPR Cimahi

Web app pelaporan warga untuk Dinas PUPR Kota Cimahi.
Konsep: peta sebagai antarmuka utama, verifikasi WhatsApp, dan workflow admin
berbasis status (Diterima / Ditolak / Selesai / Duplikat).

Dibangun oleh **RW3Labs** untuk Pemerintah Kota Cimahi.

---

## Tech stack

| Lapis            | Pilihan                                                              |
| ---------------- | -------------------------------------------------------------------- |
| Frontend & API   | Next.js 14 (App Router) + Server Actions + React 18 + Tailwind       |
| Database         | Neon Postgres + ekstensi PostGIS (geofencing & deteksi duplikat)     |
| ORM              | Drizzle ORM (HTTP driver Neon)                                       |
| Auth admin       | Auth.js (NextAuth v5 beta) credentials                               |
| Verifikasi warga | OTP 6 digit via WhatsApp (Starsender)                                |
| Notifikasi WA    | Starsender (kirim) + template DB editable                            |
| Peta             | Leaflet + OpenStreetMap + marker cluster                             |
| Foto             | Cloudflare R2 (presigned PUT) + kompresi client (browser-image-compression) |
| Anti-bot         | Cloudflare Turnstile + rate limit Postgres                           |
| Deploy           | Railway (Next.js) + Neon (DB) + R2 (storage)                         |

## Fitur fase 1 (siap produksi)

- Pelaporan warga 4 langkah (peta → kategori+foto → identitas+OTP → kirim).
- Geofencing wilayah Kota Cimahi (3 kecamatan, 15 kelurahan) via PostGIS.
- Auto-fill kecamatan/kelurahan dari titik (ST_Contains).
- Deteksi duplikat radius 75m (ST_DWithin) + opsi "dukung laporan yang ada".
- Verifikasi nomor WA via OTP, nomor disimpan terenkripsi (AES-256-GCM).
- Rate limit harian per nomor (default 3 laporan/hari).
- Peta publik dengan cluster marker, filter status, halaman tracking publik.
- Panel admin dengan peta + tabel, audit log lengkap (status history).
- Aksi admin: Terima / Tolak (alasan) / Gabung Duplikat / Selesai (foto bukti).
- Setiap perubahan status memicu WA otomatis ke pelapor.
- PWA-ready (manifest + icon).
- Compliance UU PDP 27/2022 (consent, kebijakan privasi, retensi 24 bulan).

## Setup lokal

```bash
# 1. Install deps
pnpm install

# 2. Siapkan env
cp .env.example .env
# Edit .env: isi DATABASE_URL (Neon), AUTH_SECRET, ENCRYPTION_KEY,
# STARSENDER_API_KEY, R2_*, TURNSTILE_* (opsional di dev)

# 3. Generate keys
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # ENCRYPTION_KEY

# 4. Aktifkan PostGIS + jalankan migrasi
pnpm db:migrate

# 5. Seed data awal (kategori, region Cimahi, template WA, super admin)
pnpm db:seed
# Default super admin: admin@pupr.cimahikota.go.id / PuprCimahi2026!
# WAJIB ganti password setelah login pertama.

# 6. Jalankan dev server
pnpm dev
```

Buka <http://localhost:3000> untuk site warga, atau <http://localhost:3000/admin/login> untuk admin.

## Deploy ke Railway

1. Push repo ini ke GitHub.
2. Buat project baru di Railway, hubungkan ke repo.
3. Set env vars (dari `.env.example`) di Railway Variables.
4. Pastikan `DATABASE_URL` menunjuk ke Neon pooler connection string
   (akhirannya `-pooler.region.aws.neon.tech`).
5. Setelah deploy pertama, jalankan `pnpm db:migrate` dan `pnpm db:seed`
   melalui Railway Shell.
6. Tambahkan custom domain (mis. `lapor.pupr.cimahikota.go.id`) lewat Railway Settings.

### Railway Cron untuk retry WA (opsional Fase 1, wajib Fase 2)

Tambah cron job `*/5 * * * *` dengan command:

```
pnpm wa:retry
```

## Cloudflare R2 (storage foto)

1. Buat bucket `pupr-cimahi-photos`.
2. Generate R2 API token (Read+Write ke bucket tsb).
3. Buat custom domain (mis. `photos.pupr.cimahikota.go.id`) atau pakai
   public `r2.dev` URL.
4. Set env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `R2_PUBLIC_URL`.

Tanpa env R2, sistem fallback ke `/public/uploads` (dev saja, tidak persistent di Railway).

## Starsender (WhatsApp Gateway)

1. Daftar di <https://starsender.online>, hubungkan nomor WA bisnis Dinas PUPR.
2. Generate API key, set `STARSENDER_API_KEY` di env.
3. Webhook inbound (Fase 2): set ke `https://APP_URL/api/starsender/webhook?key=SECRET`.
4. Template pesan bisa diedit super admin di `/admin/templat`.

## Boundary wilayah Cimahi (penting)

Saat ini boundary di `db/seed-data.ts` adalah **bounding box kasar** tiap kelurahan
(±390m radius). Untuk produksi, ganti dengan boundary akurat:

1. Ambil shapefile dari BPS Cimahi / Disdukcapil / OSM.
2. Konversi ke GeoJSON: `ogr2ogr -f GeoJSON cimahi.geojson cimahi.shp`.
3. Ganti `bbox: [...]` dengan `geojson: { ... }` lalu update `scripts/seed.ts`
   untuk pakai `ST_Multi(ST_GeomFromGeoJSON(...))`.
4. Re-run `pnpm db:seed`.

## Struktur folder

```
app/
  (public)/               # site warga
    page.tsx              # landing + peta publik
    lapor/                # wizard 4 langkah
    laporan/[kode]/       # tracking publik
    panduan/ tentang/ privasi/
  admin/                  # panel admin
    login/
    (authed)/             # protected
      page.tsx            # dashboard peta
      laporan/            # tabel + detail + aksi
      pengguna/           # super admin only
      templat/            # super admin only
  api/                    # endpoint REST
    otp/ reports/ region/ nearby/ upload/
    starsender/webhook/   # WA inbound
    admin/report-lookup/  # lookup by kode untuk merge
components/
  ui/                     # shadcn-style primitives
  map/                    # Leaflet (dynamic import)
  report/                 # wizard, photo upload, duplicate check
  admin/                  # status actions
  layout/                 # header & footer
db/
  schema.ts               # Drizzle schema
  seed-data.ts            # kategori, region, template WA
  migrations/             # SQL Drizzle output
lib/
  auth.ts                 # Auth.js (node)
  auth.config.ts          # Auth.js (edge-safe untuk middleware)
  encryption.ts           # AES-256-GCM nomor WA + hash
  geo.ts                  # PostGIS helpers
  starsender.ts           # wrapper API
  wa-notify.ts            # tinggi-level notify + log
  rate-limit.ts           # rate limit harian
  turnstile.ts            # captcha
  storage.ts              # presigned R2
  validation.ts           # Zod schemas shared
  queries.ts              # reusable read queries
  status.ts               # status label/warna
  utils.ts                # cn, formatDate, dll
scripts/
  migrate.ts              # CREATE EXTENSION postgis + drizzle migrate
  seed.ts                 # seed kategori/region/template/admin
  wa-retry.ts             # retry pesan WA gagal
middleware.ts             # proteksi /admin (edge runtime)
```

## Yang ditunda ke Fase 2

- Konfirmasi warga 2-arah via WA (parse balasan YA/TIDAK).
- SLA per kategori + alert overdue.
- Dashboard analytics (heatmap waktu, top kategori, ekspor PDF/Excel).
- Assignment ke petugas lapangan + mobile-friendly status update.
- Status `dikerjakan` (di antara `diterima` & `selesai`).
- Reopen status.
- Audit log UI (data sudah tercatat di `report_status_history`).
- Integrasi SSO Pemkot.

## Lisensi & kepemilikan

- **Pengendali data**: Dinas PUPR Kota Cimahi.
- **Pengembang**: RW3Labs.
- Kode di repo ini hak cipta Pemerintah Kota Cimahi.
