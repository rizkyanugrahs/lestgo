"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, LocateOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { useGeolocation } from "@/hooks/useGeolocation";
import { directionsUrl, formatDistance, haversineKm } from "@/lib/geo";
import type { Idea } from "@/lib/types";
import { useRoomId } from "../RoomProvider";

const MAX_SPOTS = 5;

export default function NearestSlider() {
  const roomId = useRoomId();
  const { coords, error } = useGeolocation();

  const { data: ideas, loading } = useRealtimeQuery<Idea>("ideas", roomId, () =>
    supabase.from("ideas").select("*").eq("room_id", roomId).eq("is_visited", false)
      .not("latitude", "is", null).not("longitude", "is", null)
  );

  const nearest = useMemo(() => {
    const withDistance = ideas.map((idea) => ({
      idea,
      km: coords ? haversineKm(coords, { lat: idea.latitude!, lng: idea.longitude! }) : null,
    }));
    if (coords) withDistance.sort((a, b) => a.km! - b.km!);
    else withDistance.sort((a, b) => +new Date(b.idea.created_at) - +new Date(a.idea.created_at));
    return withDistance.slice(0, MAX_SPOTS);
  }, [ideas, coords]);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-5">
        <h2 className="text-lg font-bold">Terdekat di wishlist</h2>
        {error && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><LocateOff className="h-3 w-3" /> GPS mati</span>}
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden px-5">
          {[0, 1].map((i) => <div key={i} className="h-52 w-[78%] shrink-0 animate-pulse rounded-3xl bg-zinc-200" />)}
        </div>
      ) : nearest.length === 0 ? (
        <div className="mx-5 rounded-3xl border border-dashed border-violet-200 bg-violet-50/50 p-6 text-center text-sm text-zinc-500">
          Belum ada tempat yang punya lokasi.<br />Tambahkan ide di tab <b>Lists</b> supaya muncul di sini.
        </div>
      ) : (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {nearest.map(({ idea, km }, i) => (
            <motion.article key={idea.id}
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="relative h-52 w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-200">
              {idea.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={idea.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {km !== null && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur">
                  <MapPin className="h-3 w-3" /> {formatDistance(km)}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="line-clamp-1 text-lg font-bold text-white">{idea.title}</h3>
                {idea.location_name && <p className="mb-2 line-clamp-1 text-xs text-white/80">{idea.location_name}</p>}
                <a href={directionsUrl(idea.latitude!, idea.longitude!)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-violet-700 transition active:scale-95">
                  <Navigation className="h-3.5 w-3.5" /> Get Directions
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
