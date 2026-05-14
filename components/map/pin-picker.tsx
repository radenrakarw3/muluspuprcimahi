"use client";

/**
 * Peta untuk memilih titik laporan (wizard langkah 1).
 *
 * - Meminta izin lokasi saat peta dimuat; fokus awal ke posisi Anda (zoom dekat).
 * - Mode ikuti pergerakan (seperti GMaps): peta mengikuti GPS sampai Anda menggeser peta.
 * - Pin laporan bisa digeser/diubah terpisah dari titik kuning lokasi Anda.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CIMAHI_CENTER,
  CIMAHI_DEFAULT_ZOOM,
  CIMAHI_MAX_BOUNDS,
  GEO_MAX_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./constants";
import { makePinIcon, makeUserLocationIcon } from "./pin-icon";
import { Button } from "@/components/ui/button";
import { LocateFixed, MapPin, Navigation } from "lucide-react";

type LatLng = { lat: number; lng: number };

type GeoStatus = "loading" | "ready" | "denied" | "timeout" | "unsupported";

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ pos, zoom }: { pos: LatLng | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!pos) return;
    map.flyTo([pos.lat, pos.lng], zoom, { duration: 0.55 });
  }, [pos, zoom, map]);
  return null;
}

function PanToFollowUser({ pos, follow }: { pos: LatLng | null; follow: boolean }) {
  const map = useMap();
  const prev = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!follow) {
      prev.current = null;
    }
  }, [follow]);
  useEffect(() => {
    if (!pos || !follow) return;
    const last = prev.current;
    prev.current = pos;
    if (last) {
      const dy = pos.lat - last.lat;
      const dx = pos.lng - last.lng;
      if (Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7) return;
    }
    map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.35 });
  }, [pos, follow, map]);
  return null;
}

function DragDisablesFollow({ onDragStart }: { onDragStart: () => void }) {
  useMapEvents({
    dragstart() {
      onDragStart();
    },
  });
  return null;
}

export default function PinPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [flyZoom, setFlyZoom] = useState(GEO_MAX_ZOOM);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("loading");
  const [followUser, setFollowUser] = useState(true);
  const initialFixApplied = useRef(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinIcon = useMemo(() => makePinIcon("#f5cc33"), []);
  const userIcon = useMemo(() => makeUserLocationIcon(), []);

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current != null) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  const requestGeolocation = useCallback(() => {
      if (!navigator.geolocation) {
        setGeoStatus("unsupported");
        return;
      }

      setGeoStatus("loading");
      clearLoadingTimer();
      loadingTimerRef.current = setTimeout(() => {
        setGeoStatus((s) => (s === "loading" ? "timeout" : s));
        loadingTimerRef.current = null;
      }, 12000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearLoadingTimer();
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGeoStatus("ready");
          setFollowUser(true);
          setUserPos(p);
          setFlyZoom(GEO_MAX_ZOOM);
          setFlyTarget(p);
          if (!initialFixApplied.current) {
            initialFixApplied.current = true;
            onChangeRef.current(p);
          }
        },
        (err) => {
          clearLoadingTimer();
          if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
          else setGeoStatus("timeout");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
  }, []);

  useEffect(() => {
    requestGeolocation();
    return () => clearLoadingTimer();
  }, [requestGeolocation]);

  useEffect(() => {
    if (geoStatus !== "ready" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [geoStatus]);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        onChangeRef.current(p);
        setFlyZoom(GEO_MAX_ZOOM);
        setFlyTarget(p);
        setFollowUser(true);
        setGeoStatus("ready");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
        else setGeoStatus("timeout");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function centerOnUserOnce() {
    if (userPos) {
      setFlyZoom(GEO_MAX_ZOOM);
      setFlyTarget({ ...userPos });
      setFollowUser(true);
    } else {
      locate();
    }
  }

  const showBlockingOverlay = geoStatus === "loading";
  const showSoftWarning = geoStatus === "denied" || geoStatus === "timeout" || geoStatus === "unsupported";

  return (
    <div className="relative h-[55vh] w-full overflow-hidden rounded-xl border bg-muted">
      <MapContainer
        center={CIMAHI_CENTER}
        zoom={CIMAHI_DEFAULT_ZOOM}
        maxBounds={CIMAHI_MAX_BOUNDS}
        maxZoom={GEO_MAX_ZOOM}
        minZoom={11}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <ClickHandler onPick={(p) => onChangeRef.current(p)} />
        <FlyTo pos={flyTarget} zoom={flyZoom} />
        <PanToFollowUser pos={userPos} follow={followUser && geoStatus === "ready"} />
        <DragDisablesFollow
          onDragStart={() => {
            setFollowUser(false);
          }}
        />
        {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as unknown as { getLatLng: () => LatLng }).getLatLng();
                onChangeRef.current({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>

      {showBlockingOverlay && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-background/85 p-4 text-center backdrop-blur-sm">
          <Navigation className="h-10 w-10 text-primary" aria-hidden />
          <p className="max-w-sm text-sm font-medium">Izinkan akses lokasi di popup browser</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Lokasi dipakai untuk menampilkan posisi Anda di peta dan mempermudah penempatan pin laporan.
            Tanpa izin, ketepatan titik akan berkurang.
          </p>
        </div>
      )}

      {showSoftWarning && !showBlockingOverlay && (
        <div className="absolute left-2 right-2 top-2 z-[500] rounded-lg border-2 border-primary bg-card p-3 text-sm shadow-lg">
          {geoStatus === "denied" && (
            <>
              <p className="font-medium">Akses lokasi ditolak</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Di bilah alamat browser, buka ikon gembok / informasi situs → setel <strong>Lokasi</strong> ke{" "}
                <strong>Izinkan</strong>, lalu ketuk &quot;Coba lagi&quot;.
              </p>
            </>
          )}
          {geoStatus === "timeout" && (
            <>
              <p className="font-medium">Lokasi belum terbaca</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pastikan GPS aktif dan Anda di area terbuka, lalu coba lagi.
              </p>
            </>
          )}
          {geoStatus === "unsupported" && (
            <p className="text-xs text-muted-foreground">Perangkat atau browser ini tidak mendukung geolokasi.</p>
          )}
          {geoStatus !== "unsupported" && (
            <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => requestGeolocation()}>
              Coba lagi
            </Button>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[400] flex justify-center px-3">
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg ring-1 ring-primary/30">
          <p className="text-xs text-muted-foreground">
            Geser peta atau klik untuk menempatkan pin di lokasi kerusakan. Titik kuning = Anda; pin = lokasi laporan.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={locate}>
              <LocateFixed className="h-4 w-4" /> Lokasi ke pin
            </Button>
            <Button type="button" variant={followUser ? "default" : "outline"} size="sm" onClick={centerOnUserOnce}>
              <MapPin className="h-4 w-4" />
              Pusatkan & ikuti
            </Button>
          </div>
          {geoStatus === "ready" && (
            <p className="text-[11px] text-muted-foreground">
              {followUser
                ? "Peta mengikuti pergerakan Anda. Geser peta dengan jari/mouse untuk menghentikan ikutan."
                : "Mode ikuti mati karena peta digeser. Ketuk \"Pusatkan & ikuti\" untuk mengaktifkan lagi."}
            </p>
          )}
          {value && (
            <p className="text-xs text-muted-foreground">
              Koordinat pin: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
