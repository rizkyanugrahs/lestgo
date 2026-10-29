"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { fmtShort } from "@/lib/dates";
import type { Place } from "@/lib/types";

/** Auto slideshow of up to 5 places rated 5 stars. */
export default function FlashbackSlideshow({ items, onOpen }: { items: Place[]; onOpen: (p: Place) => void }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const p = items[i % items.length];

  return (
    <button onClick={() => onOpen(p)}
      className="relative block aspect-[16/11] w-full overflow-hidden rounded-3xl bg-brand text-left shadow-lg shadow-wine-700/30 transition active:scale-[0.98]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={p.id} className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}>
          {p.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photos[0]} alt="" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand"><Heart className="h-14 w-14 fill-white/20 text-white/20" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="line-clamp-1 text-lg font-bold">{p.title}</h3>
            <p className="text-xs text-white/80">{p.visited_date ? fmtShort(p.visited_date) : ""}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <span aria-label="5-star favorites"
        className="absolute left-3 top-3 flex items-center gap-0.5 rounded-full border border-white/40 bg-white/25 px-2.5 py-1.5 backdrop-blur-md">
        {[0, 1, 2, 3, 4].map((k) => <Star key={k} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />)}
      </span>
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {items.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i % items.length ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}
        </div>
      )}
    </button>
  );
}
