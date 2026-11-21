"use client";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ListX, MapPinned, Plus, Search, SlidersHorizontal } from "lucide-react";
import { NEARBY } from "@/lib/categories";
import { normName, visitEvents } from "@/lib/places";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";
import CategoryTabs from "../CategoryTabs";
import PlaceFormModal from "../places/PlaceFormModal";
import PlaceDetail from "../places/PlaceDetail";
import ListItem from "./ListItem";
import NearbyCategoriesSheet from "./NearbyCategoriesSheet";

type Section = "wishlist" | "nearby";

export default function ListsScreen() {
  const { places, loading, mainCategories, nearbyCategories, refetch } = useData();
  const [section, setSection] = useState<Section>("wishlist");
  const [category, setCategory] = useState("All");
  const [sub, setSub] = useState("All");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const nearby = section === "nearby";

  const matches = (p: Place) =>
    !q || p.title.toLowerCase().includes(q)
    || (p.location_name ?? "").toLowerCase().includes(q)
    || (p.description ?? "").toLowerCase().includes(q);

  // Regular wishlist: everything except Nearby spots
  const wishlistItems = useMemo(() => places
    .filter((p) => p.status === "wishlist" && p.category !== NEARBY
      && (category === "All" || p.category === category) && matches(p))
    .sort((a, b) =>
      (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [places, category, q]);

  // Nearby spots stay on the list: visiting them again and again is the point
  const nearbyItems = useMemo(() => places
    .filter((p) => p.status === "wishlist" && p.category === NEARBY
      && (sub === "All" || p.subcategory === sub) && matches(p))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [places, sub, q]);

  // How many times each Nearby spot was visited (every visit is its own entry in Memories)
  const visitCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) {
      if (p.status !== "visited") continue;
      const k = normName(p.title);
      m.set(k, (m.get(k) ?? 0) + visitEvents(p));
    }
    return m;
  }, [places]);

  const openPlace = useCallback((p: Place) => setViewing(p.id), []);
  const viewed = places.find((p) => p.id === viewing) ?? null;
  const items = nearby ? nearbyItems : wishlistItems;
  const hasAny = places.some((p) => p.status === "wishlist" && (nearby ? p.category === NEARBY : p.category !== NEARBY));

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
      active ? "border-transparent bg-brand text-white shadow-md shadow-wine-700/25" : "border-white/60 bg-white/60 text-zinc-600 shadow-sm backdrop-blur-md"}`;

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setAdding(true)} aria-label={nearby ? "Add a nearby spot" : "Add to wishlist"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-wine-700/30 transition active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="glass flex items-center rounded-2xl px-3 focus-within:border-wine-600/40">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
      </header>

      {/* Wishlist (trips and dates) is kept apart from Nearby (spots close to home) */}
      <div className="px-5 pb-3">
        <div className="glass flex rounded-full p-1">
          {(["wishlist", "nearby"] as Section[]).map((s) => (
            <button key={s} onClick={() => setSection(s)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition ${section === s ? "bg-brand text-white shadow" : "text-zinc-500"}`}>
              {s === "nearby" && <MapPinned className="h-4 w-4" />} {s === "wishlist" ? "Wishlist" : "Nearby"}
            </button>
          ))}
        </div>
      </div>

      {nearby ? (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-5 pb-3">
          {["All", ...nearbyCategories].map((c) => (
            <button key={c} onClick={() => setSub(c)} className={pill(sub === c)}>{c}</button>
          ))}
          <button onClick={() => setManaging(true)} aria-label="Manage sub-categories"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/60 text-wine-700 shadow-sm backdrop-blur-md transition active:scale-95">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <CategoryTabs value={category} onChange={setCategory} categories={mainCategories} />
      )}

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200/70" />)}</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
            <ListX className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
            {hasAny
              ? "No matches."
              : nearby
                ? "No nearby spots yet. Tap + to add cafes and eateries close to home."
                : "Nothing here yet. Tap + to add your first wishlist place."}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => <ListItem key={p.id} place={p} onOpen={openPlace} visits={nearby ? visitCounts.get(normName(p.title)) ?? 0 : 0} />)}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <PlaceFormModal mode="wishlist"
            defaultCategory={nearby ? NEARBY : category}
            defaultSubcategory={nearby && sub !== "All" ? sub : undefined}
            onClose={() => setAdding(false)} onSaved={refetch} />
        )}
        {managing && <NearbyCategoriesSheet onClose={() => setManaging(false)} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
