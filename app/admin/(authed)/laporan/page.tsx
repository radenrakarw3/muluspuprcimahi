import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listReportsForMap } from "@/lib/queries";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";
import { timeAgo } from "@/lib/utils";
import type { ReportStatusValue } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminListPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = searchParams.status as ReportStatusValue | undefined;
  const q = searchParams.q;

  const items = await listReportsForMap({
    status: status ? [status] : undefined,
    q: q ?? undefined,
    limit: 200,
  });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Daftar Laporan</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} laporan ditampilkan.
        </p>
      </header>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari deskripsi..."
          className="h-9 rounded-md border px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Semua status</option>
          <option value="baru">Baru</option>
          <option value="diterima">Diterima</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
          <option value="duplikat">Digabung</option>
        </select>
        <button
          type="submit"
          className="rounded-md border bg-background px-3 text-sm hover:bg-muted"
        >
          Terapkan
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Kode</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Diajukan</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{r.kode}</td>
                <td className="px-3 py-2">{r.category_nama}</td>
                <td className="px-3 py-2">
                  <Badge className={STATUS_COLOR[r.status]} variant="outline">
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {timeAgo(r.created_at)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/laporan/${r.kode}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Detail <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada laporan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
