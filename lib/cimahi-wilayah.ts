/**
 * Referensi dropdown Kecamatan / Kelurahan Kota Cimahi + kode pos.
 * Nama harus konsisten dengan seed DB (`db/seed-data.ts`) untuk laporan admin.
 */

export type KelurahanRef = { nama: string; kodePos: string };

export type KecamatanRef = {
  nama: string;
  kelurahan: KelurahanRef[];
};

export const KECAMATAN_CIMAHI: KecamatanRef[] = [
  {
    nama: "Cimahi Selatan",
    kelurahan: [
      { nama: "Cibeber", kodePos: "40531" },
      { nama: "Cibeureum", kodePos: "40535" },
      { nama: "Leuwigajah", kodePos: "40532" },
      { nama: "Melong", kodePos: "40534" },
      { nama: "Utama", kodePos: "40533" },
    ],
  },
  {
    nama: "Cimahi Tengah",
    kelurahan: [
      { nama: "Baros", kodePos: "40521" },
      { nama: "Cigugur Tengah", kodePos: "40522" },
      { nama: "Cimahi", kodePos: "40525" },
      { nama: "Karangmekar", kodePos: "40523" },
      { nama: "Padasuka", kodePos: "40526" },
      { nama: "Setiamanah", kodePos: "40524" },
    ],
  },
  {
    nama: "Cimahi Utara",
    kelurahan: [
      { nama: "Cibabat", kodePos: "40513" },
      { nama: "Cipageran", kodePos: "40511" },
      { nama: "Citeureup", kodePos: "40512" },
      { nama: "Pasirkaliki", kodePos: "40514" },
    ],
  },
];

const KEL_SET = new Map<string, Set<string>>();
for (const k of KECAMATAN_CIMAHI) {
  KEL_SET.set(k.nama, new Set(k.kelurahan.map((x) => x.nama)));
}

export function isValidWilayah(kecamatan: string, kelurahan: string): boolean {
  const set = KEL_SET.get(kecamatan.trim());
  if (!set) return false;
  return set.has(kelurahan.trim());
}

export function getKelurahanList(kecamatan: string): KelurahanRef[] {
  const k = KECAMATAN_CIMAHI.find((x) => x.nama === kecamatan);
  return k?.kelurahan ?? [];
}
