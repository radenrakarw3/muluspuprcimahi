import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_ACRONYM_LONG, BRAND_PROGRAM, TAGLINE } from "@/lib/brand";

export function LandingHero({ reportCount }: { reportCount: number }) {
  const countLabel =
    reportCount > 0
      ? `${reportCount.toLocaleString("id-ID")} titik di peta`
      : "Data titik publik";

  return (
    <section className="relative overflow-hidden border-b border-primary/25">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,hsl(48_100%_52%/0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,hsl(220_58%_11%)_0%,hsl(var(--background))_42%,hsl(220_72%_9%)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(115deg,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(25deg,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden
      />

      <div className="container relative px-4 py-14 md:py-20 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary md:text-xs">
              Pemerintah Kota Cimahi · Dinas PUPR
            </p>
            <p className="mt-3 text-lg font-bold tracking-tight text-primary md:text-xl">{BRAND_PROGRAM}</p>
            <p className="text-xs font-medium leading-snug text-muted-foreground md:text-sm">{BRAND_ACRONYM_LONG}</p>
            <p className="mt-3 text-sm italic text-primary/95 md:text-base">&ldquo;{TAGLINE}&rdquo;</p>
            <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-foreground md:text-4xl lg:text-5xl lg:leading-[1.08]">
              Layanan pelaporan infrastruktur jalan & drainase, transparan dan terlacak.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0 lg:max-w-none">
              Warga dapat melaporkan kerusakan resmi, memantau status, dan menerima pembaruan melalui WhatsApp — tanpa mengunduh aplikasi.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-14 min-w-[220px] rounded-lg px-8 text-base font-semibold shadow-[0_4px_24px_hsl(48_100%_40%/0.25)] transition hover:brightness-105"
              >
                <Link href="/lapor" className="inline-flex items-center gap-2">
                  Mulai laporan
                  <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 min-w-[200px] rounded-lg border-2 border-primary/70 bg-card/40 px-8 text-base font-medium text-foreground backdrop-blur-sm hover:bg-secondary/80"
              >
                <Link href="/cek-laporan">Cek nomor laporan</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" aria-hidden />
                Kanal resmi pemerintah daerah
              </span>
              <span className="inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" aria-hidden />
                Responsif di perangkat genggam
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                {countLabel} di peta publik
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent opacity-80 blur-sm lg:-inset-2 lg:rounded-[1.75rem]" aria-hidden />

            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-card shadow-[0_28px_100px_hsl(220_85%_3%/0.55)] ring-1 ring-primary/20">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" aria-hidden />

              <div className="relative aspect-[819/1024] w-full max-h-[min(78vh,560px)] sm:max-h-[520px] lg:max-h-[580px]">
                <Image
                  src="/hero-pupr-cimahi.png"
                  alt="Ilustrasi kepemimpinan dan pembangunan infrastruktur Dinas PUPR Kota Cimahi"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover object-[center_18%] transition duration-700 ease-out hover:scale-[1.02]"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-background/82 to-transparent sm:h-[36%]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/40 to-transparent sm:h-20 sm:from-background/50"
                  aria-hidden
                />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-primary/40 bg-background/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary shadow-md backdrop-blur-md sm:left-5 sm:top-5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {BRAND_PROGRAM}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-7">
                  <p className="max-w-md border-l-2 border-primary/70 pl-3 text-xs italic leading-relaxed text-foreground/90 sm:text-sm">
                    Melayani dengan hati, membangun kota cimahi Mantap semakin Hepi
                  </p>
                </div>
              </div>

              <div className="relative border-t border-primary/25 bg-card/95 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-5">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Alur singkat laporan
                </p>
                <ol className="mt-3 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
                  <li className="flex gap-2.5 rounded-xl border border-primary/20 bg-background/50 px-3 py-2.5 sm:flex-col sm:items-center sm:text-center">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                      1
                    </span>
                    <span className="text-left text-xs leading-snug text-muted-foreground sm:text-center">
                      <strong className="block text-foreground">Titik & wilayah</strong>
                      Lokasi akurat di peta.
                    </span>
                  </li>
                  <li className="flex gap-2.5 rounded-xl border border-primary/20 bg-background/50 px-3 py-2.5 sm:flex-col sm:items-center sm:text-center">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                      2
                    </span>
                    <span className="text-left text-xs leading-snug text-muted-foreground sm:text-center">
                      <strong className="block text-foreground">Bukti & OTP</strong>
                      Foto, kategori, WhatsApp.
                    </span>
                  </li>
                  <li className="flex gap-2.5 rounded-xl border border-primary/20 bg-background/50 px-3 py-2.5 sm:flex-col sm:items-center sm:text-center">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                      3
                    </span>
                    <span className="text-left text-xs leading-snug text-muted-foreground sm:text-center">
                      <strong className="block text-foreground">Pantau</strong>
                      Kode 7 digit & peta publik.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
