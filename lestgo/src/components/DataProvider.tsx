"use client";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { normName } from "@/lib/places";
import type { Folder, Place, RoomSettings } from "@/lib/types";

type RoomInfo = { anniversary_date: string | null; couple_photo_url: string | null };
type Ctx = {
  places: Place[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  roomInfo: RoomInfo;
  categories: string[];
  saveSettings: (patch: Partial<Omit<RoomSettings, "room_id">>) => Promise<string | null>;
};
const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const pq = useRealtimeQuery<Place>("places", roomId, () =>
    supabase.from("places").select("*").eq("room_id", roomId).order("created_at", { ascending: false })
  );
  const fq = useRealtimeQuery<Folder>("list_folders", roomId, () =>
    supabase.from("list_folders").select("*").eq("room_id", roomId).order("created_at", { ascending: false })
  );
  const sq = useRealtimeQuery<RoomSettings>("room_settings", roomId, () =>
    supabase.from("room_settings").select("*").eq("room_id", roomId)
  );

  const places = useMemo(() => {
    const normalized = pq.data.map((p) => ({
      ...p,
      folder_id: p.folder_id ?? null,
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
  const categories = useMemo(
    () => (settingsCategories && settingsCategories.length ? settingsCategories : DEFAULT_CATEGORIES),
    [settingsCategories]
  );
  const anniversary = settings?.anniversary_date ?? null;
  const couplePhoto = settings?.couple_photo_url ?? null;
  const roomInfo = useMemo<RoomInfo>(
    () => ({ anniversary_date: anniversary, couple_photo_url: couplePhoto }),
    [anniversary, couplePhoto]
  );

  const refetchPlaces = pq.refetch, refetchFolders = fq.refetch, refetchSettings = sq.refetch;
  const refetch = useCallback(() => { refetchPlaces(); refetchFolders(); }, [refetchPlaces, refetchFolders]);

  const saveSettings = useCallback<Ctx["saveSettings"]>(async (patch) => {
    const { error } = await supabase.from("room_settings").upsert({ room_id: roomId, ...patch });
    if (error) return error.message;
    await refetchSettings();
    return null;
  }, [roomId, refetchSettings]);

  const loading = pq.loading || fq.loading;
  const error = pq.error ?? fq.error ?? sq.error;
  const folders = fq.data;

  // One memoized value: consumers only re-render when something they can see actually changed
  const value = useMemo<Ctx>(
    () => ({ places, folders, loading, error, refetch, roomInfo, categories, saveSettings }),
    [places, folders, loading, error, refetch, roomInfo, categories, saveSettings]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};
