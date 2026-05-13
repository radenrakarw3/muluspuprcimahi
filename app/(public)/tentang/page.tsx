export const metadata = { title: "Tentang" };

export default function TentangPage() {
  return (
    <div className="container max-w-2xl space-y-5 py-8">
      <h1 className="text-2xl font-bold">Tentang Lapor PUPR Cimahi</h1>

      <p>
        <strong>Lapor PUPR Cimahi</strong> adalah kanal resmi pelaporan warga
        terhadap kerusakan infrastruktur yang menjadi kewenangan Dinas Pekerjaan Umum
        dan Penataan Ruang (PUPR) Kota Cimahi.
      </p>

      <h2 className="text-lg font-semibold">Lingkup laporan</h2>
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        <li>Jalan berlubang, retak, atau ambles</li>
        <li>Lampu Penerangan Jalan Umum (PJU) mati / rusak</li>
        <li>Drainase, got, saluran air mampet atau rusak</li>
        <li>Trotoar yang rusak / tertutup</li>
        <li>Jembatan dan fasilitas umum terkait infrastruktur</li>
      </ul>

      <h2 className="text-lg font-semibold">Wilayah</h2>
      <p className="text-sm text-muted-foreground">
        Kota Cimahi: Kecamatan Cimahi Utara, Cimahi Tengah, dan Cimahi Selatan
        (15 kelurahan). Laporan di luar wilayah ini akan otomatis ditolak.
      </p>

      <h2 className="text-lg font-semibold">Alur tindak lanjut</h2>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Laporan masuk, warga menerima konfirmasi via WA.</li>
        <li>Tim PUPR memverifikasi laporan dan memutuskan: diterima, ditolak (dengan alasan), atau digabung dengan laporan serupa.</li>
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
