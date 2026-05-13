import Link from "next/link";
import { MapPinned, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPinned className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Lapor PUPR Cimahi</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Dinas PUPR Kota Cimahi
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/panduan"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
          >
            Panduan
          </Link>
          <Link
            href="/tentang"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
          >
            Tentang
          </Link>
          <Button asChild size="sm">
            <Link href="/lapor">
              <Megaphone className="h-4 w-4" /> Lapor
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
