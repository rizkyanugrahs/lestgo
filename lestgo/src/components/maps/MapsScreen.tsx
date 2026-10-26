"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import { haversineKm } from "@/lib/geo";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import type { Idea, Memory } from "@/lib/types";
import { useRoomId } from "../RoomProvider";
import PinCard from "./PinCard";
import type { Pin } from "./types";
import type { Focus } from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-violet-100" />,
});

type FolderRow = { id: string; category: string };

export default function MapsScreen() {
  const roomId = useRoomId();
  const { coords, error: gpsError } = useGeolocation();
  const [category, setCategory] = useState("All");
  const [showWish, setShowWish] = useState(true);
  const [showVisited, setShowVisited] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  const ideas = useRealtimeQuery<Idea>("ideas", roomId, () =>
    supabase.from("ideas").select("*").eq("room_id", roomId));
  const folders = useRealtimeQuery<FolderRow>("list_folders", roomId, () =>
    supabase.from("list_folders").select("id, category").eq("room_id", roomId));
  const memories = useRealtimeQuery<Memory>("memories", roomId, () =>
    supabase.from("memories").select("*").eq("room_id", roomId));

  const allPins = useMemo<Pin[]>(() => {
    const catOf = new Map(folders.data.map((f) => [f.id, f.category]));
    const memoryNames = new Set(memories.data.map((m) => m.place_name.trim().toLowerCase()));
    const out: Pin[] = [];

    for (const i of ideas.data) {
      if (i.latitude === null || i.longitude === null) continue;
      // Ide yang sudah dikunjungi tapi belum dicatat jadi kenangan tetap tampil hijau
      if (i.is_visited && memoryNames.has(i.title.trim().toLowerCase())) continue;
      out.push({
        id: "i-" + i.id, kind: i.is_visited ? "visited" : "wish", title: i.title,
        subtitle: i.location_name, lat: i.latitude, lng: i.longitude,
        category: catOf.get(i.folder_id) ?? null, photo: i.cover_url, rating: null, date: null,
      });
    }
    for (const m of memories.data) {
      if (m.latitude === null || m.longitude === null) continue;
      out.push({
        id: "m-" + m.id, kind: "visited", title: m.place_name, subtitle: m.notes,
        lat: m.latitude, lng: m.longitude, category: m.category, photo: m.photo_url,
        rating: m.rating, date: m.visit_date,
      });
    }
    return out;
  }, [ideas.data, folders.data, memories.data]);

  const boundsPts = useMemo<[number, number][]>(() => allPins.map((p) => [p.lat, p.lng]), [allPins]);

  const pins = useMemo(
    () => allPins.filter((p) =>
      (p.kind === "wish" ? showWish : showVisited) && (category === "All" || p.category === category)),
    [allPins, category, showWish, showVisited]
  );

  const withKm = (p: Pin) => (coords ? haversineKm(coords, { lat: p.lat, lng: p.lng }) : null);

  const nearest = useMemo(() => {
    const wish = pins.filter((p) => p.kind === "wish").map((p) => ({ pin: p, km: withKm(p) }));
    if (coords) wish.sort((a, b) => a.km! - b.km!);
    return wish.slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, coords]);

  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const loading = ideas.loading || memories.loading;

  const select = (p: Pin) => { setSelectedId(p.id); setFocus({ lat: p.lat, lng: p.lng, n: Date.now() }); };
  const locate = () => coords && setFocus({ lat: coords.lat, lng: coords.lng, n: Date.now() });

  return (
    <div className="fixed inset-0">
      <div className="absolute inset-0 isolate">
        <MapView pins={pins} selectedId={selected?.id ?? null} onSelect={setSelectedId}
          user={coords} focus={focus} boundsPts={boundsPts} />
      </div>

      {/* Filter di atas peta */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto px-4 pb-2">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium shadow-md transition ${category === c ? "bg-violet-600 text-white" : "bg-white/95 text-zinc-700 backdrop-blur"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-2 px-4">
          <button onClick={() => setShowWish(!showWish)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition ${showWish ? "bg-white/95 text-zinc-800" : "bg-white/60 text-zinc-400"}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> Wishlist
          </button>
          <button onClick={() => setShowVisited(!showVisited)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition ${showVisited ? "bg-white/95 text-zinc-800" : "bg-white/60 text-zinc-400"}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Dikunjungi
          </button>
        </div>
      </div>

      {/* Tombol lokasi saya */}
      <button onClick={locate} disabled={!coords} aria-label="Ke lokasi saya"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+6.25rem)] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-600 shadow-lg transition active:scale-95 disabled:text-zinc-300">
        <LocateFixed className="h-5 w-5" />
      </button>

      {/* Kartu bawah */}
      <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-10">
        <div className="mx-auto max-w-md">
          {selected ? (
            <div className="px-4">
              <PinCard pin={selected} km={withKm(selected)} onClose={() => setSelectedId(null)} />
            </div>
          ) : !loading && allPins.length === 0 ? (
            <div className="mx-4 rounded-3xl bg-white/95 p-5 text-center text-sm text-zinc-600 shadow-xl backdrop-blur">
              Belum ada tempat dengan lokasi.<br />Tambahkan ide di tab <b>Lists</b> lalu pilih lokasinya.
            </div>
          ) : nearest.length > 0 ? (
            <>
              <p className="mb-1.5 px-5 text-xs font-semibold text-zinc-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                {coords ? "Dekat kamu" : gpsError ? "Wishlist (GPS mati)" : "Wishlist"}
              </p>
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                {nearest.map(({ pin, km }) => (
                  <PinCard key={pin.id} pin={pin} km={km} onClick={() => select(pin)} className="w-[85%] shrink-0 snap-center" />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
