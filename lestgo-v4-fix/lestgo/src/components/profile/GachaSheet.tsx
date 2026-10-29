"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, Navigation } from "lucide-react";
import { groupVisited, placeMapsHref } from "@/lib/places";
import type { Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import CategoryTabs from "../CategoryTabs";
import { useData } from "../DataProvider";

type Source = "wishlist" | "picks" | "visited";
const SOURCES: { key: Source; label: string; empty: string }[] = [
  { key: "wishlist", label: "Wishlist", empty: "wishlist places" },
  { key: "picks", label: "Picks", empty: "Picks" },
  { key: "visited", label: "Visited", empty: "visited places" },
];

export default function GachaSheet({ onClose, onOpen }: { onClose: () => void; onOpen: (p: Place) => void }) {
  const { places, categories } = useData();
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState<Source>("wishlist");
  const [rolling, setRolling] = useState(false);
  const [shown, setShown] = useState("");
  const [result, setResult] = useState<Place | null>(null);
  const timers = useRef<{ iv?: ReturnType<typeof setInterval>; to?: ReturnType<typeof setTimeout> }>({});

  const pool = useMemo(() => {
    const inCat = (p: Place) => category === "All" || p.category === category;
    if (source === "wishlist") return places.filter((p) => p.status === "wishlist" && inCat(p));
    if (source === "picks") return places.filter((p) => p.is_comfort_pick && inCat(p));
    // Visited: one candidate per place (its latest entry), so a place isn't favored just because you went often
    return groupVisited(places.filter((p) => p.status === "visited" && inCat(p)))
      .map((g) => g.reduce((a, b) => ((b.visited_date ?? "") > (a.visited_date ?? "") ? b : a)));
  }, [places, source, category]);

  useEffect(() => () => { clearInterval(timers.current.iv); clearTimeout(timers.current.to); }, []);
  useEffect(() => { setResult(null); }, [source, category]);

  const roll = () => {
    if (pool.length === 0 || rolling) return;
    setRolling(true); setResult(null);
    timers.current.iv = setInterval(() => setShown(pool[Math.floor(Math.random() * pool.length)].title), 75);
    timers.current.to = setTimeout(() => {
      clearInterval(timers.current.iv);
      setResult(pool[Math.floor(Math.random() * pool.length)]);
      setRolling(false);
    }, 1600);
  };

  const emptyLabel = SOURCES.find((s) => s.key === source)!.empty;

  return (
    <BottomSheet title="Spin random place" onClose={onClose}>
      <div className="-mx-5 space-y-4">
        <div className="px-5">
          <div className="glass flex rounded-full p-1">
            {SOURCES.map((s) => (
              <button key={s.key} onClick={() => setSource(s.key)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${source === s.key ? "bg-brand text-white shadow" : "text-zinc-500"}`}>{s.label}</button>
            ))}
          </div>
        </div>
        <CategoryTabs value={category} onChange={setCategory} categories={categories} />

        <div className="px-5">
          <div className="flex min-h-36 flex-col items-center justify-center rounded-3xl bg-brand p-5 text-center text-white shadow-lg shadow-wine-700/30">
            {pool.length === 0 ? (
              <p className="text-sm text-white/85">No {emptyLabel} in this category yet.</p>
            ) : rolling ? (
              <p className="text-xl font-bold">{shown}</p>
            ) : (
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div key={result.id} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                    <p className="text-xs font-semibold text-white/75">Your pick:</p>
                    <p className="text-2xl font-extrabold">{result.title}</p>
                    <p className="mt-1 text-xs text-white/80">{[result.category, result.location_name].filter(Boolean).join(" · ")}</p>
                  </motion.div>
                ) : (
                  <p key="idle" className="text-sm text-white/85">{pool.length} option{pool.length === 1 ? "" : "s"} ready. Tap Spin!</p>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="space-y-3 px-5">
          <button onClick={roll} disabled={pool.length === 0 || rolling}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
            <Dices className="h-5 w-5" /> {result ? "Spin again" : "Spin"}
          </button>
          {result && (
            <div className="flex gap-3">
              <a href={placeMapsHref(result)} target="_blank" rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-wine-700/10 py-3 font-semibold text-wine-700"><Navigation className="h-4 w-4" /> Get Directions</a>
              <button onClick={() => onOpen(result)} className="flex-1 rounded-2xl bg-white/70 py-3 font-semibold text-zinc-700 ring-1 ring-white/60">View details</button>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
