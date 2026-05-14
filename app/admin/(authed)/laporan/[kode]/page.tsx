import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, MapPin, MessageCircle } from "lucide-react";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { getReportByKode } from "@/lib/queries";
import { decryptWa } from "@/lib/encryption";
import StatusActions from "@/components/admin/status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";
import { formatDateTime, maskWa, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportDetail({
  params,
}: {
  params: { kode: string };
}) {
  const r = await getReportByKode(params.kode);
  if (!r) notFound();

  // Ambil nomor WA terenkripsi untuk admin
  const row = (
    await db
      .select({ enc: reports.pelaporWaEnc })
      .from(reports)
      .where(eq(reports.id, r.id))
  )[0];
  const wa = row ? decryptWa(row.enc) : "";

  const beforePhotos = r.photos.filter((p) => p.kind === "before");
  const afterPhotos = r.photos.filter((p) => p.kind === "after");

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link
        href="/admin/laporan"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Daftar
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-xl border p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {r.categoryNama} • {r.categoryBidang ?? "—"}
                </p>
                <h1 className="font-mono text-2xl font-bold">{r.kode}</h1>
                <p className="text-xs text-muted-foreground">
                  Diajukan {timeAgo(r.createdAt)} • {formatDateTime(r.createdAt)}
                </p>
              </div>
              <Badge className={STATUS_COLOR[r.status]} variant="outline">
                {STATUS_LABEL[r.status]}
              </Badge>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm">{r.deskripsi}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Lokasi" icon={<MapPin className="h-4 w-4" />}>
                {[r.kecamatan, r.kelurahan].filter(Boolean).join(" / ") || "—"}
                {(r.rt || r.rw) && (
                  <>
                    {" "}
                    • RT {r.rt || "-"} / RW {r.rw || "-"}
                  </>
                )}
                {r.alamat && (
                  <p className="text-xs text-muted-foreground">Patokan: {r.alamat}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.lat}, {r.lng} •{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                    href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                  >
                    Buka di Google Maps
                  </a>
                </p>
              </Info>
              <Info label="Pelapor" icon={<MessageCircle className="h-4 w-4" />}>
                <p className="font-medium">{r.pelaporNama}</p>
                <p className="text-xs text-muted-foreground">
                  WA: {maskWa(wa)}{" "}
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-primary hover:underline"
                  >
                    Buka chat
                  </a>
                </p>
                {r.dukunganCount > 0 && (
                  <p className="mt-1 text-xs">
                    +{r.dukunganCount} dukungan warga lain
                  </p>
                )}
              </Info>
            </div>
          </div>

          {beforePhotos.length > 0 && (
            <PhotoGrid label="Foto laporan" photos={beforePhotos.map((p) => p.url)} />
          )}
          {afterPhotos.length > 0 && (
            <PhotoGrid label="Foto bukti tindak lanjut" photos={afterPhotos.map((p) => p.url)} />
          )}

          {r.rejectedReason && (
            <Card className="border-2 border-primary bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardTitle>Alasan penolakan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm opacity-95">
                {r.rejectedReason}
              </CardContent>
            </Card>
          )}

          {r.resolvedNote && (
            <Card className="border border-primary bg-secondary">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground">Catatan tindak lanjut</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {r.resolvedNote}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Riwayat status (audit log)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l pl-4">
                {r.history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[22px] top-1 inline-block h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">
                      {STATUS_LABEL[h.toStatus]}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        • {formatDateTime(h.createdAt)}
                      </span>
                    </p>
                    {h.alasan && (
                      <p className="text-sm text-muted-foreground">{h.alasan}</p>
                    )}
                    {h.changedByAdmin && (
                      <p className="text-xs text-muted-foreground">
                        oleh admin {h.changedByAdmin}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <StatusActions reportId={r.id} reportKode={r.kode} status={r.status} />
        </aside>
      </div>
    </div>
  );
}

function Info({
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
