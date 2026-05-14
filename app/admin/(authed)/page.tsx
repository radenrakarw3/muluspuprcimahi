import Link from "next/link";
import { CheckCircle2, Clock, ScrollText, Megaphone, ShieldAlert } from "lucide-react";
import { AdminDashboardPanel } from "@/components/admin/admin-dashboard-panel";
import { PublicMap } from "@/components/map/loaders";
import { auth } from "@/lib/auth";
import { getAdminDashboardInsights, listReportsForMap, reportsAdminStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  const status = searchParams.status as
    | "baru"
    | "diterima"
    | "selesai"
    | "ditolak"
    | "duplikat"
    | undefined;

  const [items, stats] = await Promise.all([
    listReportsForMap({ status: status ? [status] : undefined, limit: 2000 }),
    reportsAdminStats(),
  ]);
  const insights = await getAdminDashboardInsights(stats);
  const showWaTemplateLink = session?.user.role === "super_admin";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Peta &amp; Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan angka di bawah; filter status lewat kartu, lalu tinjau posisi di peta.
          </p>
        </div>
        <Link
          href="/admin/laporan"
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <ScrollText className="h-4 w-4" /> Lihat sebagai daftar
        </Link>
      </header>

      <AdminDashboardPanel
        stats={stats}
        insights={insights}
        showWaTemplateLink={showWaTemplateLink}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatusCard
          href="/admin?status=baru"
          active={status === "baru"}
          label="Baru"
          value={stats.baru}
          icon={<Megaphone className="h-4 w-4" />}
          tone="default"
        />
        <StatusCard
          href="/admin?status=diterima"
          active={status === "diterima"}
          label="Diterima"
          value={stats.diterima}
          icon={<Clock className="h-4 w-4" />}
          tone="info"
        />
        <StatusCard
          href="/admin?status=selesai"
          active={status === "selesai"}
          label="Selesai"
          value={stats.selesai}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
        <StatusCard
          href="/admin?status=ditolak"
          active={status === "ditolak"}
          label="Ditolak"
          value={stats.ditolak}
          icon={<ShieldAlert className="h-4 w-4" />}
          tone="danger"
        />
        <StatusCard
          href="/admin?status=duplikat"
          active={status === "duplikat"}
          label="Digabung"
          value={stats.duplikat}
          icon={<ScrollText className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      <PublicMap
        reports={items}
        hrefBase="/admin/laporan"
        className="h-[70vh] w-full overflow-hidden rounded-xl border"
      />
    </div>
  );
}

function StatusCard({
  href,
  active,
  label,
  value,
  icon,
  tone,
}: {
  href: string;
  active: boolean;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "default" | "info" | "success" | "warning" | "danger";
}) {
  const toneMap: Record<string, string> = {
    default: "border-border bg-card text-foreground",
    info: "border-border bg-secondary text-foreground",
    success: "border-2 border-primary bg-primary text-primary-foreground",
    warning: "border-2 border-primary bg-secondary text-foreground",
    danger: "border-2 border-primary bg-destructive text-destructive-foreground",
  };
  return (
    <Link
      href={href}
      className={`rounded-xl border p-3 ${toneMap[tone]} ${active ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center gap-2 text-xs opacity-90">
        {icon} {label}
      </div>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString("id-ID")}</p>
    </Link>
  );
}
