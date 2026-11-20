"use client";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ListX, Plus, Search } from "lucide-react";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";
import CategoryTabs from "../CategoryTabs";
import PlaceFormModal from "../places/PlaceFormModal";
import PlaceDetail from "../places/PlaceDetail";
import ListItem from "./ListItem";

export default function ListsScreen() {
  const { places, loading, categories, refetch } = useData();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  // Only wishlist places live in Lists. Visited places show up in Home and Memories instead.
  const items = useMemo(() => places
    .filter((p) => p.status === "wishlist"
      && (category === "All" || p.category === category)
      && (!q || p.title.toLowerCase().includes(q)
        || (p.location_name ?? "").toLowerCase().includes(q)
        || (p.description ?? "").toLowerCase().includes(q)))
    .sort((a, b) =>
      (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)),
  [places, category, q]);

  const openPlace = useCallback((p: Place) => setViewing(p.id), []);
  const viewed = places.find((p) => p.id === viewing) ?? null;
  const hasWishlist = places.some((p) => p.status === "wishlist");

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setAdding(true)} aria-label="Add to wishlist"
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

      <CategoryTabs value={category} onChange={setCategory} categories={categories} />

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200/70" />)}</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
            <ListX className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
            {hasWishlist ? "No matches." : "Nothing here yet. Tap + to add your first wishlist place."}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => <ListItem key={p.id} place={p} onOpen={openPlace} />)}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {adding && <PlaceFormModal mode="wishlist" defaultCategory={category} onClose={() => setAdding(false)} onSaved={refetch} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
