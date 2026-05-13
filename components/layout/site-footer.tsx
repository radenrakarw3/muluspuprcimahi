import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-muted/30">
      <div className="container grid gap-6 py-8 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">Lapor PUPR Cimahi</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kanal resmi pelaporan kerusakan infrastruktur Kota Cimahi.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <strong>Bukan kanal darurat.</strong> Untuk kebakaran, longsor, atau
            kecelakaan: hubungi 112.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-medium">Tautan</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Peta Laporan
              </Link>
            </li>
            <li>
              <Link href="/panduan" className="hover:text-foreground">
                Panduan Melapor
              </Link>
            </li>
            <li>
              <Link href="/tentang" className="hover:text-foreground">
                Tentang
              </Link>
            </li>
            <li>
              <Link href="/privasi" className="hover:text-foreground">
                Kebijakan Privasi
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-medium">Kontak</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Dinas PUPR Kota Cimahi</li>
            <li>Jl. Demang Hardjakusumah, Cimahi</li>
            <li>pupr@cimahikota.go.id</li>
          </ul>
        </div>
      </div>
      <div className="border-t bg-background/50">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pemerintah Kota Cimahi.</p>
          <p>
            Dikembangkan oleh{" "}
            <a
              href="https://rw3labs.id"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:text-primary"
            >
              RW3Labs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
