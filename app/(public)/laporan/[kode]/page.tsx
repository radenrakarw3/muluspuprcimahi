import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReportByKode } from "@/lib/queries";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportDetail({
  params,
  searchParams,
}: {
  params: { kode: string };
  searchParams: { baru?: string };
}) {
  const r = await getReportByKode(params.kode.toUpperCase());
  if (!r) notFound();

  const beforePhotos = r.photos.filter((p) => p.kind === "before");
  const afterPhotos = r.photos.filter((p) => p.kind === "after");

  return (
    <div className="container max-w-3xl space-y-5 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Peta
      </Link>

      {searchParams.baru && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <p>
            Laporan Anda telah masuk. Kami mengirim konfirmasi ke WhatsApp Anda.
            Mohon menunggu verifikasi tim PUPR.
          </p>
        </div>
      )}

      <div className="rounded-xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {r.categoryNama}
            </p>
            <h1 className="text-2xl font-bold">{r.kode}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" /> Diajukan {timeAgo(r.createdAt)} •{" "}
              {formatDateTime(r.createdAt)}
            </p>
          </div>
          <Badge className={STATUS_COLOR[r.status]} variant="outline">
            {STATUS_LABEL[r.status]}
          </Badge>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm">{r.deskripsi}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Lokasi" icon={<MapPin className="h-4 w-4" />}>
            {[r.kecamatan, r.kelurahan].filter(Boolean).join(" / ") || "—"}
            {(r.rt || r.rw) && (
              <span className="text-muted-foreground">
                {" "}
                • RT {r.rt || "-"} / RW {r.rw || "-"}
              </span>
            )}
            {r.alamat && (
              <p className="text-xs text-muted-foreground">Patokan: {r.alamat}</p>
            )}
          </InfoBlock>
          <InfoBlock label="Pelapor" icon={<Users className="h-4 w-4" />}>
            {r.pelaporNama}
            {r.dukunganCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                +{r.dukunganCount} dukungan warga
              </span>
            )}
          </InfoBlock>
        </div>
      </div>

      {beforePhotos.length > 0 && (
        <PhotoGrid label="Foto Laporan" photos={beforePhotos.map((p) => p.url)} />
      )}
      {afterPhotos.length > 0 && (
        <PhotoGrid
          label="Foto Bukti Tindak Lanjut"
          photos={afterPhotos.map((p) => p.url)}
        />
      )}

      {r.status === "ditolak" && r.rejectedReason && (
        <Card className="border-rose-200 bg-rose-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-rose-900">
              <ShieldAlert className="h-4 w-4" /> Alasan Penolakan
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-rose-900">{r.rejectedReason}</CardContent>
        </Card>
      )}

      {r.status === "selesai" && r.resolvedNote && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> Catatan Tindak Lanjut
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-900">{r.resolvedNote}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 border-l pl-4">
            {r.history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[22px] top-1 inline-block h-3 w-3 rounded-full bg-primary" />
                <p className="text-sm font-medium">
                  {STATUS_LABEL[h.toStatus]}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    • {timeAgo(h.createdAt)} • {formatDateTime(h.createdAt)}
                  </span>
                </p>
                {h.alasan && <p className="text-sm text-muted-foreground">{h.alasan}</p>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBlock({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
      <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function PhotoGrid({ label, photos }: { label: string; photos: string[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">{label}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

void Image; // hindari warning unused import bila tidak dipakai
