"use client";

import L from "leaflet";

/** Warna titik tengah pin (kontras di semua warna status). */
const INNER = "#0f172a";

/** Ukuran tampilan pin di peta (viewBox tetap 32×42 agar bentuk proporsional). */
const PIN_W = 22;
const PIN_H = Math.round((PIN_W * 42) / 32);

export function makePinIcon(color: string): L.DivIcon {
  const safe = /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#2563eb";
  const html = `<div class="report-map-pin" style="--report-pin-fill:${safe}">
  <svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 32 42" class="leaflet-pin" aria-hidden="true">
    <path fill="var(--report-pin-fill)" d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 26 16 26s16-14.5 16-26c0-8.837-7.163-16-16-16z"/>
    <circle cx="16" cy="16" r="6" fill="${INNER}"/>
  </svg></div>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H],
    popupAnchor: [0, -Math.round(PIN_H * 0.9)],
  });
}

export function makeUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#f5cc33;border:3px solid #0f2744;box-shadow:0 0 0 3px rgba(245,204,51,0.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
