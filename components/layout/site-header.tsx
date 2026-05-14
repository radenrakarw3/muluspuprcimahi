import Image from "next/image";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_ACRONYM_LONG, BRAND_SHORT } from "@/lib/brand";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-primary/25 bg-background/90 shadow-[0_1px_0_hsl(48_100%_52%/0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-14 items-center justify-between gap-4 md:h-16">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-card/80 shadow-sm ring-1 ring-primary/10 transition group-hover:border-primary/55 md:h-11 md:w-11">
            <Image
              src="/logo-pupr.png"
              alt="Logo PUPR"
              width={44}
              height={44}
              className="h-8 w-auto object-contain md:h-9"
              priority
            />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">{BRAND_SHORT}</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:text-[11px]">
              {BRAND_ACRONYM_LONG}
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/cek-laporan"
            className="hidden rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground sm:inline-block"
          >
            Cek laporan
          </Link>
          <Link
            href="/panduan"
            className="hidden rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground md:inline-block"
          >
            Panduan
          </Link>
          <Button asChild size="sm" className="h-9 rounded-lg px-4 font-semibold shadow-sm sm:h-10 sm:px-5">
            <Link href="/lapor" className="inline-flex items-center gap-2">
              <Megaphone className="h-4 w-4" aria-hidden />
              Lapor
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
