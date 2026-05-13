"use client";

/**
 * Peta untuk memilih titik laporan (wizard langkah 1).
 *
 * Fitur:
 * - Geolokasi otomatis (kalau diizinkan), fallback ke pusat Cimahi.
 * - Klik di peta atau drag marker untuk mengubah titik.
 * - Tombol "Gunakan lokasi saya" untuk geolokasi ulang.
 */
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CIMAHI_CENTER,
  CIMAHI_DEFAULT_ZOOM,
  CIMAHI_MAX_BOUNDS,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./constants";
import { makePinIcon, makeUserLocationIcon } from "./pin-icon";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

type LatLng = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ pos }: { pos: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [pos, map]);
  return null;
}

export default function PinPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  const pinIcon = useMemo(() => makePinIcon("#059669"), []);
  const userIcon = useMemo(() => makeUserLocationIcon(), []);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        onChange(p);
        setFlyTarget(p);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="relative h-[55vh] w-full overflow-hidden rounded-xl border bg-muted">
      <MapContainer
        center={value ? [value.lat, value.lng] : CIMAHI_CENTER}
        zoom={value ? 17 : CIMAHI_DEFAULT_ZOOM}
        maxBounds={CIMAHI_MAX_BOUNDS}
        minZoom={11}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <ClickHandler onPick={onChange} />
        <FlyTo pos={flyTarget} />
        {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as unknown as { getLatLng: () => LatLng }).getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[400] flex justify-center px-3">
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-xl bg-background/95 p-3 shadow-lg ring-1 ring-border backdrop-blur">
          <p className="text-xs text-muted-foreground">
            Geser peta atau klik untuk menempatkan pin di lokasi kerusakan.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={locate}>
            <LocateFixed className="h-4 w-4" /> Gunakan lokasi saya
          </Button>
          {value && (
            <p className="text-xs text-muted-foreground">
              Koordinat: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
