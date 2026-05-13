"use client";

import { MapPin, Users } from "lucide-react";
import type { NearbyReport } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/status";
import type { ReportStatusValue } from "@/db/schema";

export default function DuplicateCheck({
  items,
  onSupport,
  onContinue,
}: {
  items: NearbyReport[];
  onSupport: (parentId: string) => void;
  onContinue: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 h-5 w-5 text-amber-700" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            Laporan serupa ditemukan di dekat lokasi Anda
          </h3>
          <p className="text-sm text-amber-800">
            Daripada bikin laporan baru, Anda bisa <strong>mendukung</strong> laporan yang
            sudah ada agar tim PUPR lebih cepat menindaklanjuti.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">{it.kode}</span>
              <span>•</span>
              <span>{STATUS_LABEL[it.status as ReportStatusValue]}</span>
              <span>•</span>
              <span>{timeAgo(it.created_at)}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{it.category_nama}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{it.deskripsi}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> ±{Math.round(it.jarak_meter)}m dari titik Anda
                {it.dukungan_count > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                    <Users className="h-3 w-3" /> {it.dukungan_count} dukungan
                  </span>
                )}
              </span>
              <Button size="sm" type="button" onClick={() => onSupport(it.id)}>
                Dukung laporan ini
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end border-t border-amber-200 pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onContinue}>
          Tetap buat laporan baru
        </Button>
      </div>
    </div>
  );
}
