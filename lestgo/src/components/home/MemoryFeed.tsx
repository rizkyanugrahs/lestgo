"use client";
import { motion } from "framer-motion";
import { CalendarDays, Star, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import type { Memory } from "@/lib/types";
import { useRoomId } from "../RoomProvider";

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function MemoryFeed() {
  const roomId = useRoomId();
  const { data: memories, loading } = useRealtimeQuery<Memory>("memories", roomId, () =>
    supabase.from("memories").select("*").eq("room_id", roomId)
      .order("visit_date", { ascending: false }).order("created_at", { ascending: false }).limit(20)
  );

  return (
    <section className="px-5">
      <h2 className="mb-3 text-lg font-bold">Baru dikunjungi</h2>

      {loading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-zinc-200" />)}</div>
      ) : memories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
          <Camera className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          Belum ada kenangan. Kunjungi tempat dari wishlist lalu catat di sini!
        </div>
      ) : (
        <div className="space-y-5">
          {memories.map((m, i) => (
            <motion.article key={m.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: Math.min(i, 3) * 0.05 }}
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-100">
              <div className="relative aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photo_url} alt={m.place_name} loading="lazy" className="h-full w-full object-cover" />
                {m.rating && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {m.rating}.0
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold leading-tight">{m.place_name}</h3>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-400">
                    <CalendarDays className="h-3 w-3" /> {fmtDate(m.visit_date)}
                  </span>
                </div>
                {m.notes && <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{m.notes}</p>}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
