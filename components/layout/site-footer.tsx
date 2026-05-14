import Link from "next/link";
import { BRAND_SHORT } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-primary/40 bg-secondary/80">
      <div className="container space-y-4 py-6">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link href="/cek-laporan" className="hover:text-foreground">
            Cek laporan
          </Link>
          <Link href="/panduan" className="hover:text-foreground">
            Panduan
          </Link>
          <Link href="/tentang" className="hover:text-foreground">
            Tentang
          </Link>
          <Link href="/privasi" className="hover:text-foreground">
            Privasi
          </Link>
        </nav>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Bukan nomor darurat. Kebakaran atau kecelakaan: hubungi{" "}
          <strong className="text-foreground">112</strong>.
        </p>
        <div className="flex flex-col items-center justify-between gap-2 border-t border-primary/25 pt-4 text-[11px] text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Pemkot Cimahi · {BRAND_SHORT}</span>
          <a
            href="https://rw3labs.id"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            RW3Labs
          </a>
        </div>
      </div>
    </footer>
  );
}
