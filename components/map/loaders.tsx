"use client";

/**
 * Dynamic imports untuk Leaflet (ssr:false).
 * Pakai komponen ini di Server Component untuk hindari "window is not defined".
 */
import dynamic from "next/dynamic";

export const PinPicker = dynamic(() => import("./pin-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[55vh] w-full items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
      Memuat peta...
    </div>
  ),
});

export const PublicMap = dynamic(() => import("./public-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
      Memuat peta...
    </div>
  ),
});
