import { directionsUrl } from "./geo";
import { uploadPhoto } from "./storage";
import type { Place } from "./types";

type MapsFields = Pick<Place, "gmaps_url" | "latitude" | "longitude" | "title" | "location_name">;

/** Link navigasi: pakai link Google Maps yang ditempel kalau ada, lalu koordinat, lalu pencarian nama. */
export function placeMapsHref(p: MapsFields) {
  if (p.gmaps_url) return p.gmaps_url;
  if (p.latitude !== null && p.longitude !== null) return directionsUrl(p.latitude, p.longitude);
  const q = [p.title, p.location_name].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const uploadMany = (files: File[], roomId: string) => Promise.all(files.map((f) => uploadPhoto(f, roomId)));

export function placeError(msg: string) {
  return /does not exist|schema cache|couple_photo_url|places/i.test(msg)
    ? "Database belum diperbarui. Jalankan file supabase-refactor.sql di Supabase SQL Editor."
    : msg;
}
