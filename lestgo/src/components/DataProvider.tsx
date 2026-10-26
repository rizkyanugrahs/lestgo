"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import type { Place } from "@/lib/types";

type RoomInfo = { anniversary_date: string | null; couple_photo_url: string | null };
type Ctx = {
  places: Place[]; loading: boolean; error: string | null; refetch: () => void;
  roomInfo: RoomInfo; refetchRoom: () => void;
};
const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const q = useRealtimeQuery<Place>("places", roomId, () =>
    supabase.from("places").select("*").eq("room_id", roomId).order("created_at", { ascending: false })
  );
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({ anniversary_date: null, couple_photo_url: null });

  const loadRoom = useCallback(async () => {
    const full = await supabase.from("rooms").select("anniversary_date, couple_photo_url").eq("id", roomId).maybeSingle();
    if (!full.error && full.data) {
      setRoomInfo({ anniversary_date: full.data.anniversary_date ?? null, couple_photo_url: full.data.couple_photo_url ?? null });
      return;
    }
    // kolom foto belum ada (SQL belum dijalankan): ambil tanggal saja
    const basic = await supabase.from("rooms").select("anniversary_date").eq("id", roomId).maybeSingle();
    if (basic.data) setRoomInfo({ anniversary_date: basic.data.anniversary_date ?? null, couple_photo_url: null });
  }, [roomId]);

  useEffect(() => {
    loadRoom();
    const ch = supabase.channel(`roominfo:${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => loadRoom())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, loadRoom]);

  const places = useMemo(
    () => q.data.map((p) => ({ ...p, photos: p.photos ?? [], checklist: p.checklist ?? [] })),
    [q.data]
  );

  return (
    <DataContext.Provider value={{ places, loading: q.loading, error: q.error, refetch: q.refetch, roomInfo, refetchRoom: loadRoom }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};
