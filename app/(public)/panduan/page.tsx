import { Camera, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

export const metadata = { title: "Panduan Melapor" };

export default function PanduanPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Panduan Melapor</h1>
        <p className="text-sm text-muted-foreground">
          Empat langkah sederhana, sekitar 2 menit.
        </p>
      </header>

      <ol className="space-y-4">
        <Step icon={<MapPin className="h-5 w-5" />} step={1} title="Tunjuk lokasi">
          Geser peta atau klik untuk menempatkan pin. Anda bisa pakai tombol{" "}
          <em>“Gunakan lokasi saya”</em> agar otomatis. Pastikan pin berada di dalam
          wilayah Kota Cimahi.
        </Step>
        <Step icon={<Camera className="h-5 w-5" />} step={2} title="Pilih kategori & foto">
          Pilih jenis kerusakan (jalan, drainase, trotoar, dan lainnya sesuai daftar), tulis penjelasan singkat,
          dan unggah 1–3 foto. Foto akan otomatis dikompres agar hemat kuota.
        </Step>
        <Step icon={<MessageCircle className="h-5 w-5" />} step={3} title="Verifikasi WhatsApp">
          Masukkan nama dan nomor WA aktif. Anda akan menerima kode OTP 6 digit lewat
          WA untuk verifikasi. Nomor disimpan terenkripsi dan tidak ditampilkan publik.
        </Step>
        <Step icon={<ShieldCheck className="h-5 w-5" />} step={4} title="Kirim & pantau">
          Setujui kebijakan privasi, lalu kirim. Anda mendapat nomor laporan 7 angka dan
          notifikasi WA tiap status berubah (diterima / ditolak / selesai). Nomor dipakai di menu{" "}
          <strong className="text-foreground">Cek laporan</strong> di beranda.
        </Step>
      </ol>

      <section className="rounded-xl border border-border bg-secondary p-5">
        <h2 className="font-semibold">Tips agar laporan cepat ditindaklanjuti</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Foto jelas dan tampak skala kerusakan.</li>
          <li>Tulis patokan alamat (mis. dekat warung X, depan SD Y).</li>
          <li>Jika lihat laporan serupa di dekat lokasi Anda, dukung saja agar tim lebih cepat.</li>
          <li>Satu nomor WA maksimal 3 laporan per hari (anti-spam).</li>
        </ul>
      </section>

      <section className="rounded-xl border-2 border-primary bg-primary p-5 text-sm text-primary-foreground">
        <p className="font-semibold">Ini bukan kanal darurat.</p>
        <p>
          Untuk kebakaran, longsor, atau kecelakaan, langsung hubungi <strong>112</strong>{" "}
          atau aparat setempat.
        </p>
      </section>
    </div>
  );
}

function Step({
  step,
  title,
  icon,
  children,
}: {
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary bg-secondary text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Langkah {step}
        </p>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
