"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Check, MapPin, Navigation } from "lucide-react";
import { countdownLabel, daysUntil, todayStr } from "@/lib/dates";
import { placeMapsHref } from "@/lib/places";
import { styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";
import CompleteVisitModal from "../places/CompleteVisitModal";

const MAX_CARDS = 3;

/** Small seeded shuffle, so the random picks stay put while you use the app. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NearestSlider() {
  const { places, loading, refetch } = useData();
  const [completing, setCompleting] = useState<Place | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const today = todayStr();

  // 1) scheduled wishlist, nearest date first
  // 2) not enough? fill the rest with random wishlist places that have no upcoming date
  // 3) nothing scheduled at all? 3 random wishlist places
  const picks = useMemo(() => {
    const wish = places.filter((p) => p.status === "wishlist");
    const scheduled = wish
      .filter((p) => p.planned_date && p.planned_date >= today)
      .sort((a, b) => a.planned_date!.localeCompare(b.planned_date!))
      .slice(0, MAX_CARDS);
    if (scheduled.length >= MAX_CARDS) return scheduled;
    const used = new Set(scheduled.map((p) => p.id));
    const rest = wish.filter((p) => !used.has(p.id)).sort((a, b) => a.id.localeCompare(b.id));
    return [...scheduled, ...seededShuffle(rest, seed).slice(0, MAX_CARDS - scheduled.length)];
  }, [places, seed, today]);

  return (
    <section>
      <h2 className="mb-3 px-5 text-lg font-bold">Nearest on your wishlist</h2>

      {loading ? (
        <div className="flex gap-3 overflow-hidden px-5">
          {[0, 1].map((i) => <div key={i} className="h-52 w-[78%] shrink-0 animate-pulse rounded-3xl bg-zinc-200/70" />)}
        </div>
      ) : picks.length === 0 ? (
        <div className="glass mx-5 rounded-3xl p-6 text-center text-sm text-zinc-500">
          Your wishlist is empty.<br />Tap <b>+</b> in <b>Lists</b> to add places you want to visit.
        </div>
      ) : (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {picks.map((p, i) => {
            const scheduled = !!p.planned_date && p.planned_date >= today;
            const n = scheduled ? daysUntil(p.planned_date!) : null;
            const { Icon } = styleFor(p.category);
            return (
              <motion.article key={p.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="relative h-52 w-[80%] shrink-0 snap-center overflow-hidden rounded-3xl bg-brand shadow-lg shadow-wine-700/30">
                <Icon className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {n !== null && (
                  <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/40 px-2.5 py-1 text-[11px] font-bold ${n === 0 ? "bg-white text-wine-700" : "bg-white/25 text-white"}`}>
                    <CalendarClock className="h-3 w-3" /> {countdownLabel(n)}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="line-clamp-1 text-lg font-bold text-white">{p.title}</h3>
                  {p.location_name && <p className="mb-2 flex items-center gap-1 text-xs text-white/80"><MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{p.location_name}</span></p>}
                  <div className="flex gap-2">
                    <a href={placeMapsHref(p)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/25 px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95">
                      <Navigation className="h-3.5 w-3.5" /> Get Directions
                    </a>
                    <button onClick={() => setCompleting(p)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-wine-700 transition active:scale-95">
                      <Check className="h-3.5 w-3.5" /> Done
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {completing && <CompleteVisitModal place={completing} onClose={() => setCompleting(null)} onSaved={refetch} />}
      </AnimatePresence>
    </section>
  );
}
