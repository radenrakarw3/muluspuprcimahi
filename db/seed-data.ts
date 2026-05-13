/**
 * Data referensi Kota Cimahi (3 kecamatan, 15 kelurahan).
 *
 * Boundary di sini adalah BOUNDING BOX kasar tiap kelurahan untuk MVP.
 * Untuk produksi, GANTI dengan shapefile resmi BPS Cimahi atau Disdukcapil
 * (impor dari GeoJSON yang akurat, lalu ST_Multi(ST_GeomFromGeoJSON(...))).
 *
 * Sumber awal: koordinat pusat tiap kelurahan dari OSM/Google Maps,
 * dilebar-kan ~600m sebagai placeholder boundary.
 */

export type RegionSeed = {
  kode: string;
  level: "kota" | "kecamatan" | "kelurahan";
  nama: string;
  parentKode: string | null;
  /** Bounding box [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
};

/**
 * Boundary Kota Cimahi (kasar). Untuk produksi gunakan boundary akurat.
 * Sumber: BPS / OSM Cimahi.
 */
export const CIMAHI_BBOX: [number, number, number, number] = [
  107.5085, -6.93, 107.575, -6.832,
];

const D = 0.0035; // ~390m half-side, bbox ~780m

function bboxAround(lng: number, lat: number, d = D): [number, number, number, number] {
  return [lng - d, lat - d, lng + d, lat + d];
}

export const REGIONS: RegionSeed[] = [
  {
    kode: "3277",
    level: "kota",
    nama: "Kota Cimahi",
    parentKode: null,
    bbox: CIMAHI_BBOX,
  },
  // ===== Kecamatan Cimahi Utara =====
  {
    kode: "327701",
    level: "kecamatan",
    nama: "Cimahi Utara",
    parentKode: "3277",
    bbox: [107.5085, -6.873, 107.561, -6.832],
  },
  {
    kode: "3277011001",
    level: "kelurahan",
    nama: "Pasirkaliki",
    parentKode: "327701",
    bbox: bboxAround(107.5345, -6.852),
  },
  {
    kode: "3277011002",
    level: "kelurahan",
    nama: "Cibabat",
    parentKode: "327701",
    bbox: bboxAround(107.553, -6.857),
  },
  {
    kode: "3277011003",
    level: "kelurahan",
    nama: "Citeureup",
    parentKode: "327701",
    bbox: bboxAround(107.529, -6.842),
  },
  {
    kode: "3277011004",
    level: "kelurahan",
    nama: "Cipageran",
    parentKode: "327701",
    bbox: bboxAround(107.519, -6.836),
  },
  // ===== Kecamatan Cimahi Tengah =====
  {
    kode: "327702",
    level: "kecamatan",
    nama: "Cimahi Tengah",
    parentKode: "3277",
    bbox: [107.535, -6.9, 107.571, -6.86],
  },
  {
    kode: "3277021001",
    level: "kelurahan",
    nama: "Setiamanah",
    parentKode: "327702",
    bbox: bboxAround(107.5435, -6.879),
  },
  {
    kode: "3277021002",
    level: "kelurahan",
    nama: "Padasuka",
    parentKode: "327702",
    bbox: bboxAround(107.555, -6.875),
  },
  {
    kode: "3277021003",
    level: "kelurahan",
    nama: "Cigugur Tengah",
    parentKode: "327702",
    bbox: bboxAround(107.541, -6.89),
  },
  {
    kode: "3277021004",
    level: "kelurahan",
    nama: "Karangmekar",
    parentKode: "327702",
    bbox: bboxAround(107.553, -6.883),
  },
  {
    kode: "3277021005",
    level: "kelurahan",
    nama: "Cimahi",
    parentKode: "327702",
    bbox: bboxAround(107.546, -6.872),
  },
  {
    kode: "3277021006",
    level: "kelurahan",
    nama: "Baros",
    parentKode: "327702",
    bbox: bboxAround(107.557, -6.892),
  },
  // ===== Kecamatan Cimahi Selatan =====
  {
    kode: "327703",
    level: "kecamatan",
    nama: "Cimahi Selatan",
    parentKode: "3277",
    bbox: [107.523, -6.93, 107.575, -6.885],
  },
  {
    kode: "3277031001",
    level: "kelurahan",
    nama: "Melong",
    parentKode: "327703",
    bbox: bboxAround(107.567, -6.918),
  },
  {
    kode: "3277031002",
    level: "kelurahan",
    nama: "Cibeureum",
    parentKode: "327703",
    bbox: bboxAround(107.561, -6.91),
  },
  {
    kode: "3277031003",
    level: "kelurahan",
    nama: "Utama",
    parentKode: "327703",
    bbox: bboxAround(107.552, -6.905),
  },
  {
    kode: "3277031004",
    level: "kelurahan",
    nama: "Leuwigajah",
    parentKode: "327703",
    bbox: bboxAround(107.538, -6.912),
  },
  {
    kode: "3277031005",
    level: "kelurahan",
    nama: "Cibeber",
    parentKode: "327703",
    bbox: bboxAround(107.529, -6.92),
  },
];

export const CATEGORIES = [
  {
    slug: "jalan_berlubang",
    nama: "Jalan Berlubang / Rusak",
    ikon: "construction",
    deskripsi: "Jalan berlubang, retak, ambles, atau permukaan rusak.",
    bidang: "Bidang Bina Marga",
    urutan: 1,
  },
  {
    slug: "pju_mati",
    nama: "Lampu PJU Mati / Rusak",
    ikon: "lamp",
    deskripsi: "Penerangan Jalan Umum yang mati, redup, atau rusak.",
    bidang: "Bidang Penerangan Jalan Umum",
    urutan: 2,
  },
  {
    slug: "drainase",
    nama: "Drainase / Got Mampet",
    ikon: "droplets",
    deskripsi: "Got, selokan, atau saluran air yang mampet atau rusak.",
    bidang: "Bidang Sumber Daya Air",
    urutan: 3,
  },
  {
    slug: "trotoar",
    nama: "Trotoar Rusak",
    ikon: "footprints",
    deskripsi: "Trotoar yang rusak, berlubang, atau tertutup.",
    bidang: "Bidang Bina Marga",
    urutan: 4,
  },
  {
    slug: "jembatan",
    nama: "Jembatan Rusak",
    ikon: "bridge",
    deskripsi: "Kerusakan struktur jembatan atau pegangannya.",
    bidang: "Bidang Bina Marga",
    urutan: 5,
  },
  {
    slug: "taman",
    nama: "Taman / Fasum",
    ikon: "trees",
    deskripsi: "Kerusakan fasilitas taman, bangku, atau ruang publik.",
    bidang: "Bidang Pertamanan",
    urutan: 6,
  },
  {
    slug: "banjir",
    nama: "Genangan / Banjir",
    ikon: "waves",
    deskripsi: "Genangan air atau banjir di jalan/lingkungan.",
    bidang: "Bidang Sumber Daya Air",
    urutan: 7,
  },
  {
    slug: "lainnya",
    nama: "Lainnya",
    ikon: "more-horizontal",
    deskripsi: "Laporan terkait PUPR yang tidak masuk kategori di atas.",
    bidang: "Sekretariat",
    urutan: 99,
  },
];

export const WA_TEMPLATES = [
  {
    key: "otp",
    nama: "Kode OTP Verifikasi",
    body: `*Lapor PUPR Cimahi*

Kode verifikasi Anda: *{kode}*

Berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`,
    variables: "kode",
  },
  {
    key: "report_received",
    nama: "Laporan Diterima Sistem",
    body: `Halo {nama}, terima kasih telah melapor.

Laporan Anda dengan kode *{kode_laporan}* sudah kami terima dan akan diverifikasi oleh tim Dinas PUPR Kota Cimahi.

Pantau status: {url}`,
    variables: "nama,kode_laporan,url",
  },
  {
    key: "report_accepted",
    nama: "Laporan Diverifikasi",
    body: `Halo {nama},

Laporan *{kode_laporan}* tentang *{kategori}* telah *diterima* dan masuk antrian tindak lanjut.

Pantau status: {url}`,
    variables: "nama,kode_laporan,kategori,url",
  },
  {
    key: "report_rejected",
    nama: "Laporan Ditolak",
    body: `Halo {nama},

Mohon maaf, laporan *{kode_laporan}* belum dapat kami tindak lanjuti.

Alasan: {alasan}

Anda dapat melapor kembali dengan informasi yang lebih lengkap.`,
    variables: "nama,kode_laporan,alasan",
  },
  {
    key: "report_duplicate",
    nama: "Laporan Digabung",
    body: `Halo {nama},

Laporan *{kode_laporan}* digabung dengan laporan *{parent_kode}* karena lokasi & jenis kerusakan yang sama, agar lebih efisien ditindaklanjuti.

Pantau status: {url}`,
    variables: "nama,kode_laporan,parent_kode,url",
  },
  {
    key: "report_resolved",
    nama: "Laporan Selesai",
    body: `Halo {nama},

Kabar baik! Laporan *{kode_laporan}* telah *ditindaklanjuti*.

{catatan}

Foto bukti terlampir di halaman laporan: {url}

Terima kasih atas partisipasi Anda untuk Cimahi yang lebih baik.`,
    variables: "nama,kode_laporan,catatan,url",
  },
];
