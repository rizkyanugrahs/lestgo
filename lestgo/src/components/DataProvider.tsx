"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
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

  const places = useMemo(
    () => pq.data.map((p) => ({
      ...p,
      folder_id: p.folder_id ?? null,
      photos: p.photos ?? [],
      checklist: p.checklist ?? [],
      minus_notes: p.minus_notes ?? null,
      visit_count: p.visit_count ?? 1,
      visit_dates: p.visit_dates ?? [],
    })),
    [pq.data]
  );

  const settings = sq.data[0] ?? null;
  const categories = settings?.categories && settings.categories.length ? settings.categories : DEFAULT_CATEGORIES;
  const roomInfo: RoomInfo = {
    anniversary_date: settings?.anniversary_date ?? null,
    couple_photo_url: settings?.couple_photo_url ?? null,
  };

  const refetchPlaces = pq.refetch, refetchFolders = fq.refetch, refetchSettings = sq.refetch;
  const refetch = () => { refetchPlaces(); refetchFolders(); };

  const saveSettings: Ctx["saveSettings"] = async (patch) => {
    const { error } = await supabase.from("room_settings").upsert({ room_id: roomId, ...patch });
    if (error) return error.message;
    await refetchSettings();
    return null;
  };

  return (
    <DataContext.Provider value={{
      places, folders: fq.data, loading: pq.loading || fq.loading,
      error: pq.error ?? fq.error ?? sq.error, refetch, roomInfo, categories, saveSettings,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};
