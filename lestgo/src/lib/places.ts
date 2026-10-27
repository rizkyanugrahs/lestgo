import { directionsUrl } from "./geo";
import { todayStr } from "./dates";
import { supabase } from "./supabase";
import { uploadPhoto } from "./storage";
import type { Place } from "./types";

type MapsFields = Pick<Place, "gmaps_url" | "latitude" | "longitude" | "title" | "location_name">;

/** Navigation link: pasted Google Maps link first, then coordinates, then a name search. */
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
  return /does not exist|schema cache|room_settings|folder_id|minus_notes|visit_count|visit_dates|couple_photo_url|places/i.test(msg)
    ? "Database not updated yet. Run the supabase-v3.sql file in the Supabase SQL Editor."
    : msg;
}

/** All visit dates of one place entry. */
export function placeVisitDates(p: Place): string[] {
  if (p.status !== "visited") return [];
  if (p.visit_dates.length) return p.visit_dates;
  return p.visited_date ? [p.visited_date] : [];
}

export const latestDate = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), dates[0] ?? "");

/* ---------- Repeat visits: every visit is its own entry, visit_count is the running total ---------- */

export const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** How many visits one entry represents (older merged entries can hold several dates). */
export const visitEvents = (p: Place) => Math.max(1, p.visit_dates.length);

/** Visited entries with the same place name. */
export const visitedMatches = (places: Place[], title: string, excludeId?: string) => {
  const n = normName(title);
  return places.filter((p) => p.status === "visited" && p.id !== excludeId && normName(p.title) === n);
};

/** Total visits including the one being added now. */
export const totalVisitsFor = (places: Place[], title: string, excludeId?: string) =>
  visitedMatches(places, title, excludeId).reduce((s, p) => s + visitEvents(p), 0) + 1;

/** Write the new running total onto all other entries of the same place. */
export async function syncVisitCount(places: Place[], title: string, total: number, excludeId?: string) {
  const ids = visitedMatches(places, title, excludeId).map((p) => p.id);
  if (!ids.length) return;
  await supabase.from("places").update({ visit_count: total }).in("id", ids);
}

/** After an entry is deleted or un-visited, fix the count on the remaining entries. */
export async function resyncAfterRemoval(places: Place[], removed: Place) {
  const rest = visitedMatches(places, removed.title, removed.id);
  if (!rest.length) return;
  const sum = rest.reduce((s, p) => s + visitEvents(p), 0);
  await supabase.from("places").update({ visit_count: sum }).in("id", rest.map((p) => p.id));
}

/** Instant "done" (swipe right): becomes a visited entry dated today. Returns an error message or null. */
export async function markVisitedNow(p: Place, all: Place[]): Promise<string | null> {
  const today = todayStr();
  const total = totalVisitsFor(all, p.title, p.id);
  const { error } = await supabase.from("places")
    .update({ status: "visited", visited_date: today, visit_dates: [today], visit_count: total })
    .eq("id", p.id);
  if (error) return error.message;
  await syncVisitCount(all, p.title, total, p.id);
  return null;
}

/** Save a photo to the device (share sheet on iPhone, normal download elsewhere). */
export async function downloadPhoto(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (isIOS && nav.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; }
      catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    }
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 3000);
  } catch {
    window.open(url, "_blank");
  }
}
