"use client";

/**
 * Peta publik & admin: menampilkan semua laporan dengan cluster.
 * Klik pin -> popup dengan info ringkas + link ke detail.
 */
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import Link from "next/link";
import {
  CIMAHI_CENTER,
  CIMAHI_DEFAULT_ZOOM,
  CIMAHI_MAX_BOUNDS,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./constants";
import { makePinIcon } from "./pin-icon";
import { STATUS_LABEL, STATUS_PIN_COLOR } from "@/lib/status";
import { timeAgo } from "@/lib/utils";
import type { ReportStatusValue } from "@/db/schema";

export type PublicMapReport = {
  id: string;
  kode: string;
  lat: number;
  lng: number;
  status: ReportStatusValue;
  category_nama: string;
  category_slug: string;
  deskripsi: string;
  created_at: string;
  thumb_url?: string | null;
};

function FitOnce({ reports }: { reports: PublicMapReport[] }) {
  const map = useMap();
  useEffect(() => {
    if (!reports.length) return;
    const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [reports.length, map]);
  return null;
}

export default function PublicMap({
  reports,
  className,
  hrefBase = "/laporan",
}: {
  reports: PublicMapReport[];
  className?: string;
  hrefBase?: string;
}) {
  const [iconCache] = useState(() => new Map<string, L.DivIcon>());

  const getIcon = useMemo(
    () => (status: ReportStatusValue) => {
      const cached = iconCache.get(status);
      if (cached) return cached;
      const icon = makePinIcon(STATUS_PIN_COLOR[status]);
      iconCache.set(status, icon);
      return icon;
    },
    [iconCache],
  );

  return (
    <div className={className ?? "h-[60vh] w-full overflow-hidden rounded-xl border"}>
      <MapContainer
        center={CIMAHI_CENTER}
        zoom={CIMAHI_DEFAULT_ZOOM}
        maxBounds={CIMAHI_MAX_BOUNDS}
        minZoom={11}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <FitOnce reports={reports} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 36 : count < 50 ? 44 : 54;
            return L.divIcon({
              html: `<div class="cluster-marker" style="width:${size}px;height:${size}px;">${count}</div>`,
              className: "",
              iconSize: [size, size],
            });
          }}
        >
          {reports.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={getIcon(r.status)}>
              <Popup>
                <div className="min-w-[200px] space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {r.category_nama}
                  </p>
                  <p className="font-medium leading-tight">{r.kode}</p>
                  <p className="line-clamp-3 text-sm text-foreground/80">{r.deskripsi}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABEL[r.status]} • {timeAgo(r.created_at)}
                  </p>
                  <Link
                    href={`${hrefBase}/${r.kode}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Lihat detail &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
