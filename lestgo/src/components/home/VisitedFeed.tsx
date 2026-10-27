"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Camera, Star } from "lucide-react";
import { fmtShort } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import { useData } from "../DataProvider";
import PlaceDetail from "../places/PlaceDetail";
import VisitBadge from "../VisitBadge";

export default function VisitedFeed() {
  const { places, loading, refetch } = useData();
  const [openId, setOpenId] = useState<string | null>(null);

  const visited = useMemo(
    () => places.filter((p) => p.status === "visited")
      .sort((a, b) => (b.visited_date ?? "").localeCompare(a.visited_date ?? "") || +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 20),
    [places]
  );
  const opened = places.find((p) => p.id === openId) ?? null;

  return (
    <section className="px-5">
      <h2 className="mb-3 text-lg font-bold">Baru dikunjungi</h2>

      {loading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-zinc-200/70" />)}</div>
      ) : visited.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
          <Camera className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
          Belum ada tempat yang dikunjungi. Tekan tombol <b>+</b> untuk mencatat yang pertama!
        </div>
      ) : (
        <div className="space-y-5">
          {visited.map((p, i) => {
            const { Icon } = styleFor(p.category);
            return (
              <motion.button key={p.id} onClick={() => setOpenId(p.id)}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: Math.min(i, 3) * 0.05 }}
                className="block w-full overflow-hidden rounded-3xl border border-white/60 bg-white/80 text-left shadow-sm backdrop-blur transition active:scale-[0.98]">
                <div className="relative aspect-[4/5] bg-zinc-100">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand"><Icon className="h-14 w-14 text-white/40" /></div>
                  )}
                  <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                    {p.rating && (
                      <span className="flex items-center gap-1 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}.0
                      </span>
                    )}
                    <VisitBadge count={p.visit_count} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-tight">{p.title}</h3>
                    {p.visited_date && <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-400"><CalendarDays className="h-3 w-3" /> {fmtShort(p.visited_date)}</span>}
                  </div>
                  {p.description && <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500">{p.description}</p>}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
      </AnimatePresence>
    </section>
  );
}
