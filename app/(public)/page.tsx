import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingHero } from "@/components/landing/hero";
import { LandingMapSection } from "@/components/landing/map-section";
import { Button } from "@/components/ui/button";
import { listReportsForMap } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const reports = await listReportsForMap({ limit: 1000 });

  return (
    <div className="flex flex-col">
      <LandingHero reportCount={reports.length} />
      <LandingMapSection reports={reports} />

      <section className="relative overflow-hidden border-b border-primary/25 py-12 md:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_50%,hsl(48_100%_52%/0.08),transparent)]"
          aria-hidden
        />
        <div className="container relative flex flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-left">
          <div className="max-w-xl">
            <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Mari jaga infrastruktur bersama
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Laporan Anda membantu prioritas perbaikan di lapangan. Untuk keadaan darurat, gunakan saluran{" "}
              <strong className="text-foreground">112</strong>.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[180px] rounded-lg px-6 font-semibold shadow-md"
            >
              <Link href="/lapor" className="inline-flex items-center gap-2">
                Buat laporan
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 min-w-[160px] rounded-lg border-2 border-primary/60">
              <Link href="/tentang">Tentang layanan</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
