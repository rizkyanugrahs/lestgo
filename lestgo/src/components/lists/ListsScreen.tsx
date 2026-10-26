"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Search, ListX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";
import PlaceFormModal from "../places/PlaceFormModal";
import CompleteVisitModal from "../places/CompleteVisitModal";
import PlaceDetail from "../places/PlaceDetail";
import ListItem from "./ListItem";

export default function ListsScreen() {
  const { places, loading, refetch } = useData();
  const [view, setView] = useState<"wishlist" | "visited">("wishlist");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [completing, setCompleting] = useState<Place | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places
      .filter((p) => p.status === view)
      .filter((p) => category === "All" || p.category === category)
      .filter((p) => !q
        || p.title.toLowerCase().includes(q)
        || (p.description ?? "").toLowerCase().includes(q)
        || (p.location_name ?? "").toLowerCase().includes(q)
        || p.checklist.some((c) => c.text.toLowerCase().includes(q)))
      .sort((a, b) => view === "wishlist"
        ? (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)
        : (b.visited_date ?? "").localeCompare(a.visited_date ?? ""));
  }, [places, view, category, query]);

  const remove = async (p: Place) => {
    if (!window.confirm(`Hapus "${p.title}"?`)) return;
    await supabase.from("places").delete().eq("id", p.id);
    refetch();
  };

  const viewed = places.find((p) => p.id === viewing) ?? null;

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setAdding(true)} aria-label="Tambah ke wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-200 transition active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center rounded-2xl bg-white px-3 shadow-sm ring-1 ring-zinc-100 focus-within:ring-violet-400">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari tempat, lokasi, atau checklist"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
      </header>

      <div className="mx-5 mb-3 flex rounded-2xl bg-zinc-100 p-1">
        {(["wishlist", "visited"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${view === v ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500"}`}>
            {v === "wishlist" ? "Wishlist" : "Sudah dikunjungi"}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${category === c ? "bg-violet-600 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-100"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200" />)}</div>
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
            <ListX className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            {places.length === 0 ? "Belum ada apa-apa. Tekan + untuk menambah wishlist pertama." : "Tidak ada yang cocok."}
          </div>
        ) : (
          <>
            {view === "wishlist" && <p className="mb-2 text-xs text-zinc-400">Geser ke kiri untuk menghapus.</p>}
            <ul className="space-y-3">
              {shown.map((p) => (
                <ListItem key={p.id} place={p}
                  onOpen={() => (p.status === "visited" ? setViewing(p.id) : setEditing(p))}
                  onDone={() => setCompleting(p)} onDelete={() => remove(p)} />
              ))}
            </ul>
          </>
        )}
      </div>

      <AnimatePresence>
        {adding && <PlaceFormModal mode="wishlist" defaultCategory={category} onClose={() => setAdding(false)} onSaved={refetch} />}
        {editing && <PlaceFormModal mode="wishlist" place={editing} onClose={() => setEditing(null)} onSaved={refetch} />}
        {completing && <CompleteVisitModal place={completing} onClose={() => setCompleting(null)} onSaved={refetch} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
