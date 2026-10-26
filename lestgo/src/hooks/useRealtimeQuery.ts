"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Result<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/**
 * Ambil data, lalu ambil ulang (dengan jeda) setiap kali tabel berubah untuk room ini.
 */
export function useRealtimeQuery<T>(table: string, roomId: string, fetcher: () => Result<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const load = useCallback(async () => {
    const { data, error } = await fetchRef.current();
    if (!error) { setData(data ?? []); setLastSynced(new Date()); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    let timer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`${table}:${roomId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table, filter: `room_id=eq.${roomId}` },
        () => { clearTimeout(timer); timer = setTimeout(load, 250); })
      .subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [table, roomId, load]);

  return { data, loading, lastSynced, refetch: load };
}
