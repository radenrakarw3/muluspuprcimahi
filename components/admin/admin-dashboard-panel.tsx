import Link from "next/link";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  History,
  Inbox,
  MessageCircle,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardInsights, ReportsAdminStats } from "@/lib/queries";
import { STATUS_SHORT } from "@/lib/status";
import type { ReportStatusValue } from "@/db/schema";

function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${Math.max(pct, value > 0 ? 8 : 0)}%` }}
      />
    </div>
  );
}

export function AdminDashboardPanel({
  stats,
  insights,
  showWaTemplateLink = false,
}: {
  stats: ReportsAdminStats;
  insights: AdminDashboardInsights;
  /** Tautan pengaturan template WA hanya untuk super_admin. */
  showWaTemplateLink?: boolean;
}) {
  const maxCat = Math.max(1, ...insights.categoryBreakdown.map((c) => c.count));
  const maxKec = Math.max(1, ...insights.kecamatanBreakdown.map((k) => k.count));
  const waAttention = insights.waPending + insights.waFailedLast7Days;

  const statusOrder: ReportStatusValue[] = [
    "baru",
    "diterima",
    "selesai",
    "ditolak",
    "duplikat",
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Ringkasan dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Angka real-time dari basis data: laporan, wilayah, foto, dukungan, dan antrean WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total laporan"
          value={insights.totalReports}
          hint="Semua status"
          icon={<Inbox className="h-5 w-5" />}
        />
        <StatTile
          label="Perlu tindakan"
          value={insights.needsAction}
          hint="Baru + diterima (verifikasi / tindak lanjut)"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatTile
          label="Masuk 7 hari"
          value={insights.reportsCreatedLast7Days}
          hint="Laporan baru menurut tanggal masuk"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatTile
          label="Masuk 24 jam"
          value={insights.reportsCreatedLast24Hours}
          hint="Aktivitas warga terkini"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Perubahan status (7 hari)"
          value={insights.statusEventsLast7Days}
          hint="Riwayat status — proxy aktivitas admin & alur otomatis"
          icon={<History className="h-5 w-5" />}
        />
        <StatTile
          label="Diselesaikan (7 hari)"
          value={insights.resolvedEventsLast7Days}
          hint="Entri riwayat ke status selesai"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatTile
          label="Total dukungan"
          value={insights.totalSupports}
          hint="Warga mendukung laporan yang sudah ada"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" />
              Foto di basis data
            </CardTitle>
            <CardDescription>Sebelum (warga) vs sesudah (admin selesai)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Foto kerusakan</p>
              <p className="text-2xl font-bold tabular-nums">
                {insights.photosBefore.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Foto bukti selesai</p>
              <p className="text-2xl font-bold tabular-nums">
                {insights.photosAfter.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" />
              Antrean WhatsApp
            </CardTitle>
            <CardDescription>Log pengiriman Starsender</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Menunggu / gagal kirim ulang</span>
              <span className="font-semibold tabular-nums text-foreground">
                {insights.waPending.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Gagal (7 hari)</span>
              <span className="font-semibold tabular-nums text-foreground">
                {insights.waFailedLast7Days.toLocaleString("id-ID")}
              </span>
            </div>
            {waAttention > 0 && showWaTemplateLink ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Cek template & kunci API di{" "}
                <Link href="/admin/templat" className="font-medium text-primary underline-offset-2 hover:underline">
                  Template WA
                </Link>{" "}
                bila pesan sering gagal.
              </p>
            ) : waAttention > 0 ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Ada antrean atau kegagalan WA — hubungi super admin untuk cek template & API.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribusi status</CardTitle>
            <CardDescription>Jumlah per status — klik kartu di bawah untuk filter peta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {statusOrder.map((key) => {
              const n = stats[key] ?? 0;
              const max = Math.max(1, insights.totalReports);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{STATUS_SHORT[key]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {n.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <MiniBar value={n} max={max} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kategori</CardTitle>
              <CardDescription>Volume per jenis laporan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {insights.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                insights.categoryBreakdown.map((c) => (
                  <div key={c.slug} className="space-y-1">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="truncate font-medium" title={c.nama}>
                        {c.nama}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {c.count.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <MiniBar value={c.count} max={maxCat} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kecamatan</CardTitle>
              <CardDescription>Volume menurut isian warga</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {insights.kecamatanBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada kecamatan terisi.</p>
              ) : (
                insights.kecamatanBreakdown.map((k) => (
                  <div key={k.nama} className="space-y-1">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="truncate font-medium" title={k.nama}>
                        {k.nama}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {k.count.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <MiniBar value={k.count} max={maxKec} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
