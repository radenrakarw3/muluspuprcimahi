import Link from "next/link";
import { PublicMap } from "@/components/map/loaders";
import type { PublicMapReport } from "@/components/map/public-map";
import { STATUS_PIN_COLOR, STATUS_SHORT } from "@/lib/status";
import type { ReportStatusValue } from "@/db/schema";

const LEGEND_ORDER: ReportStatusValue[] = [
  "baru",
  "diterima",
  "selesai",
  "ditolak",
  "duplikat",
];

const LEGEND = LEGEND_ORDER.map((key) => ({
  c: STATUS_PIN_COLOR[key],
  l: STATUS_SHORT[key],
}));

export function LandingMapSection({ reports }: { reports: PublicMapReport[] }) {
  return (
    <section className="border-b border-primary/20 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(220_65%_8%)_100%)] py-14 md:py-20">
      <div className="container px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Transparansi publik
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Peta agregat laporan warga
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Visualisasi titik laporan aktif di wilayah Kota Cimahi. Klik pin untuk ringkasan; detail lengkap membuka halaman laporan resmi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {LEGEND.map((i) => (
                <span
                  key={i.l}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-primary/50" style={{ background: i.c }} />
                  {i.l}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/30 shadow-[0_20px_60px_hsl(220_85%_4%/0.35)] ring-1 ring-primary/15">
            <div className="flex flex-col gap-1 border-b border-primary/20 bg-secondary/40 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
              <p className="text-xs font-medium text-muted-foreground md:text-sm">
                Sumber data: basis laporan terverifikasi masuk · pembaruan saat memuat halaman
              </p>
              <Link
                href="/panduan"
                className="text-xs font-semibold text-primary underline-offset-4 hover:underline md:text-sm"
              >
                Panduan pelaporan
              </Link>
            </div>
            <PublicMap
              reports={reports}
              className="h-[min(58vh,520px)] w-full md:h-[min(52vh,560px)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
