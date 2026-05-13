import Link from "next/link";
import { ArrowRight, Map as MapIcon, Megaphone, ShieldCheck, Users } from "lucide-react";
import { PublicMap } from "@/components/map/loaders";
import { Button } from "@/components/ui/button";
import { listReportsForMap, reportsAdminStats } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [reports, stats] = await Promise.all([
    listReportsForMap({ limit: 1000 }),
    reportsAdminStats().catch(() => ({
      baru: 0,
      diterima: 0,
      selesai: 0,
      ditolak: 0,
      duplikat: 0,
    })),
  ]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <section className="container pt-6">
        <div className="grid items-center gap-6 sm:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3 w-3" /> Kanal resmi Pemkot Cimahi
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Laporkan kerusakan, tindak cepat oleh PUPR Cimahi.
            </h1>
            <p className="text-base text-muted-foreground">
              Jalan berlubang, lampu PJU mati, got mampet, trotoar rusak — cukup pin
              di peta, foto, dan kirim. Progres dikabari langsung lewat WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/lapor">
                  <Megaphone className="h-4 w-4" /> Buat Laporan
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/panduan">
                  Pelajari cara melapor <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Total laporan"
              value={total}
              icon={<MapIcon className="h-4 w-4" />}
            />
            <Stat
              label="Sedang ditangani"
              value={stats.diterima ?? 0}
              icon={<Users className="h-4 w-4" />}
              tone="info"
            />
            <Stat
              label="Selesai"
              value={stats.selesai ?? 0}
              icon={<ShieldCheck className="h-4 w-4" />}
              tone="success"
            />
            <Stat label="Baru" value={stats.baru ?? 0} icon={<Megaphone className="h-4 w-4" />} />
          </div>
        </div>
      </section>

      <section className="container">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Peta Laporan Warga</h2>
            <p className="text-sm text-muted-foreground">
              Klik pin untuk lihat detail. Warna pin menunjukkan status laporan.
            </p>
          </div>
          <Legend />
        </div>
        <PublicMap reports={reports} className="h-[60vh] w-full overflow-hidden rounded-xl border" />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "info" | "success";
}) {
  const cls =
    tone === "info"
      ? "bg-blue-50 text-blue-900 border-blue-100"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-900 border-emerald-100"
        : "bg-muted/30";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}

function Legend() {
  const items = [
    { c: "#64748b", l: "Baru" },
    { c: "#2563eb", l: "Diterima" },
    { c: "#059669", l: "Selesai" },
    { c: "#e11d48", l: "Ditolak" },
    { c: "#d97706", l: "Digabung" },
  ];
  return (
    <ul className="flex flex-wrap gap-2 text-xs">
      {items.map((i) => (
        <li
          key={i.l}
          className="flex items-center gap-1 rounded-full border bg-background px-2 py-1"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: i.c }}
          />
          {i.l}
        </li>
      ))}
    </ul>
  );
}
