/**
 * Konstanta peta untuk Cimahi.
 */
export const CIMAHI_CENTER: [number, number] = [-6.872, 107.542];
export const CIMAHI_DEFAULT_ZOOM = 13;

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Bounding box maksimal peta agar warga tidak nyasar jauh dari Cimahi.
 * Sedikit lebih lebar dari CIMAHI_BBOX untuk konteks tetangga.
 */
export const CIMAHI_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-6.97, 107.46],
  [-6.79, 107.62],
];
