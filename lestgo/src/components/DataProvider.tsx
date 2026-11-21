"use client";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { DEFAULT_CATEGORIES, DEFAULT_NEARBY_CATEGORIES, NEARBY } from "@/lib/categories";
import { normName } from "@/lib/places";
import type { Place, RoomSettings } from "@/lib/types";

type RoomInfo = { anniversary_date: string | null; couple_photo_url: string | null };
type Ctx = {
  places: Place[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  roomInfo: RoomInfo;
  categories: string[]; // all categories, Nearby last
  mainCategories: string[]; // your own categories, without Nearby
  nearbyCategories: string[]; // sub-categories inside Nearby
  saveSettings: (patch: Partial<Omit<RoomSettings, "room_id">>) => Promise<string | null>;
};
const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const pq = useRealtimeQuery<Place>("places", roomId, () =>
    supabase.from("places").select("*").eq("room_id", roomId).order("created_at", { ascending: false })
  );
  const sq = useRealtimeQuery<RoomSettings>("room_settings", roomId, () =>
    supabase.from("room_settings").select("*").eq("room_id", roomId)
  );

  const places = useMemo(() => {
    const normalized = pq.data.map((p) => ({
      ...p,
      folder_id: p.folder_id ?? null,
      subcategory: p.subcategory ?? null,
      photos: p.photos ?? [],
      checklist: p.checklist ?? [],
      minus_notes: p.minus_notes ?? null,
      visit_count: p.visit_count ?? 1,
      visit_dates: p.visit_dates ?? [],
    }));
    // The visit count is always recounted from the entries themselves (same name = same place),
    // so a wrong number saved earlier can never show up again.
    const totals = new Map<string, number>();
    for (const p of normalized) {
      if (p.status !== "visited") continue;
      const k = normName(p.title);
      totals.set(k, (totals.get(k) ?? 0) + Math.max(1, p.visit_dates.length));
    }
    return normalized.map((p) => (p.status === "visited" ? { ...p, visit_count: totals.get(normName(p.title)) ?? 1 } : p));
  }, [pq.data]);

  const settings = sq.data[0] ?? null;
  const settingsCategories = settings?.categories ?? null;
  const mainCategories = useMemo(() => {
    const own = (settingsCategories ?? []).filter((c) => c !== NEARBY);
    return own.length ? own : DEFAULT_CATEGORIES;
  }, [settingsCategories]);
  const categories = useMemo(() => [...mainCategories, NEARBY], [mainCategories]);
  const storedNearby = settings?.nearby_categories;
  const nearbyCategories = useMemo(
    () => (Array.isArray(storedNearby) ? storedNearby : DEFAULT_NEARBY_CATEGORIES),
    [storedNearby]
  );
  const anniversary = settings?.anniversary_date ?? null;
  const couplePhoto = settings?.couple_photo_url ?? null;
  const roomInfo = useMemo<RoomInfo>(
    () => ({ anniversary_date: anniversary, couple_photo_url: couplePhoto }),
    [anniversary, couplePhoto]
  );

  const refetch = pq.refetch;
  const refetchSettings = sq.refetch;

  const saveSettings = useCallback<Ctx["saveSettings"]>(async (patch) => {
    const { error } = await supabase.from("room_settings").upsert({ room_id: roomId, ...patch });
    if (error) return error.message;
    await refetchSettings();
    return null;
  }, [roomId, refetchSettings]);

  const loading = pq.loading;
  const error = pq.error ?? sq.error;

  // One memoized value: consumers only re-render when something they can see actually changed
  const value = useMemo<Ctx>(
    () => ({ places, loading, error, refetch, roomInfo, categories, mainCategories, nearbyCategories, saveSettings }),
    [places, loading, error, refetch, roomInfo, categories, mainCategories, nearbyCategories, saveSettings]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};
