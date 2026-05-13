"use client";

import L from "leaflet";

/** Pin SVG sederhana yang diwarnai sesuai status laporan. */
export function makePinIcon(color: string): L.DivIcon {
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" fill="${color}" class="leaflet-pin">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 26 16 26s16-14.5 16-26c0-8.837-7.163-16-16-16z"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

export function makeUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
