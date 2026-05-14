import {
  BRAND_ACRONYM,
  BRAND_ACRONYM_LONG,
  BRAND_PROGRAM,
  BRAND_PROGRAM_OFFICIAL,
  TAGLINE,
  TAGLINE_FORMAL,
} from "@/lib/brand";

export const metadata = { title: "Tentang" };

export default function TentangPage() {
  return (
    <div className="container max-w-2xl space-y-5 py-8">
      <h1 className="text-2xl font-bold">Tentang {BRAND_PROGRAM}</h1>

      <p className="text-sm font-medium italic text-primary">&ldquo;{TAGLINE}&rdquo;</p>
      <p className="text-sm text-muted-foreground">{TAGLINE_FORMAL}</p>

      <p>
        Portal <strong>{BRAND_PROGRAM}</strong> memakai akronim <strong>{BRAND_ACRONYM}</strong> yang bermakna{" "}
        <em>{BRAND_ACRONYM_LONG}</em>. Nama resmi program: <strong>{BRAND_PROGRAM_OFFICIAL}</strong>. Kanal ini untuk
        menyampaikan usulan kerusakan infrastruktur di kewenangan Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kota
        Cimahi.
      </p>

      <h2 className="text-lg font-semibold">Lingkup laporan</h2>
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        <li>Jalan berlubang, retak, atau ambles</li>
        <li>Drainase, got, saluran air mampet atau rusak</li>
        <li>Trotoar yang rusak / tertutup</li>
        <li>Jembatan dan fasilitas umum terkait infrastruktur PUPR</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Gangguan <strong className="text-foreground">lampu jalan (PJU)</strong> bukan lingkup Dinas PUPR — silakan
        laporkan melalui kanal dinas terkait di kota Anda.
      </p>

      <h2 className="text-lg font-semibold">Wilayah</h2>
      <p className="text-sm text-muted-foreground">
        Kota Cimahi: Kecamatan Cimahi Utara, Cimahi Tengah, dan Cimahi Selatan (15 kelurahan). Laporan di luar wilayah
        ini akan otomatis ditolak.
      </p>

      <h2 className="text-lg font-semibold">Alur tindak lanjut</h2>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Laporan masuk, warga menerima konfirmasi via WA.</li>
        <li>
          Tim PUPR memverifikasi laporan dan memutuskan: diterima, ditolak (dengan alasan), atau digabung dengan
          laporan serupa.
        </li>
        <li>Laporan yang diterima ditindaklanjuti tim lapangan.</li>
        <li>Setelah selesai, foto bukti perbaikan diunggah dan warga dikabari via WA.</li>
      </ol>

      <h2 className="text-lg font-semibold">Pengelola & pengembang</h2>
      <p className="text-sm text-muted-foreground">
        Dikelola oleh Dinas PUPR Kota Cimahi. Aplikasi dikembangkan oleh{" "}
        <a
          href="https://rw3labs.id"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary hover:underline"
        >
          RW3Labs
        </a>
        .
      </p>
    </div>
  );
}
