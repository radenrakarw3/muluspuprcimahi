import { BRAND_PROGRAM } from "@/lib/brand";

export const metadata = { title: "Kebijakan Privasi" };

export default function PrivasiPage() {
  return (
    <div className="container max-w-2xl space-y-5 py-8">
      <header>
        <h1 className="text-2xl font-bold">Kebijakan Privasi</h1>
        <p className="text-xs text-muted-foreground">
          Berlaku sejak {new Date().getFullYear()}. Dapat diperbarui sewaktu-waktu.
        </p>
      </header>

      <p>
        Aplikasi <strong>{BRAND_PROGRAM}</strong> mematuhi Undang-Undang Nomor 27
        Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Berikut penjelasan
        bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Data yang kami kumpulkan</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>
            <strong>Identitas pelapor:</strong> nama dan nomor WhatsApp aktif.
          </li>
          <li>
            <strong>Lokasi laporan:</strong> koordinat GPS / titik pada peta,
            kecamatan, kelurahan, RT/RW,
          </li>
          <li>
            <strong>Konten laporan:</strong> deskripsi kerusakan dan foto.
          </li>
          <li>
            <strong>Teknis:</strong> alamat IP (di-hash), waktu pengiriman.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Tujuan pemrosesan</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>Verifikasi keaslian laporan dan komunikasi tindak lanjut.</li>
          <li>Pemetaan kerusakan & pengambilan keputusan operasional PUPR.</li>
          <li>Mencegah penyalahgunaan (anti-spam).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Pengamanan</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>Nomor WA disimpan terenkripsi (AES-256-GCM) di basis data.</li>
          <li>Akses admin dilindungi otentikasi dan dicatat (audit log).</li>
          <li>Komunikasi via HTTPS.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Apa yang publik vs privat</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          <li>
            <strong>Publik di peta:</strong> kategori, deskripsi, foto, lokasi (titik),
            status. Nama pelapor ditampilkan terbatas; nomor WA tidak pernah publik.
          </li>
          <li>
            <strong>Hanya akses admin:</strong> nomor WA (terenkripsi), IP (hashed),
            kontak pelapor lengkap.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Retensi data</h2>
        <p className="text-sm text-muted-foreground">
          Data laporan disimpan maksimal <strong>24 bulan</strong> sejak laporan
          selesai/ditolak, kemudian dihapus atau dianonimkan.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Hak Anda</h2>
        <p className="text-sm text-muted-foreground">
          Sesuai UU PDP, Anda berhak untuk meminta akses, perbaikan, penghapusan, atau
          penarikan persetujuan terhadap data pribadi Anda. Permintaan dapat dikirim
          ke <strong>pupr@cimahikota.go.id</strong>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Pengendali data</h2>
        <p className="text-sm text-muted-foreground">
          Pengendali data adalah Dinas PUPR Kota Cimahi. Pengembang sistem
          (RW3Labs) bertindak sebagai pemroses data atas perintah pengendali.
        </p>
      </section>
    </div>
  );
}
