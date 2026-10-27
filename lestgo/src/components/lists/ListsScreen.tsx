"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FolderOpen, FolderPlus, ListPlus, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { markVisitedNow, placeError } from "@/lib/places";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";
import BottomSheet from "../BottomSheet";
import CategoryTabs from "../CategoryTabs";
import PlaceFormModal from "../places/PlaceFormModal";
import PlaceDetail from "../places/PlaceDetail";
import FolderModal from "./FolderModal";
import FolderView from "./FolderView";
import ListItem from "./ListItem";

export default function ListsScreen() {
  const { folders, places, loading, categories, refetch } = useData();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [chooser, setChooser] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  // Only wishlist places live in Lists. Visited places disappear from here.
  const wishlist = useMemo(() => places.filter((p) => p.status === "wishlist" && !hidden.includes(p.id)), [places, hidden]);

  const visibleFolders = useMemo(() => folders.filter((f) => {
    if (category !== "All" && f.category !== category) return false;
    if (!q) return true;
    return f.title.toLowerCase().includes(q)
      || wishlist.some((p) => p.folder_id === f.id && p.title.toLowerCase().includes(q));
  }), [folders, wishlist, category, q]);

  const direct = useMemo(() => wishlist
    .filter((p) => !p.folder_id
      && (category === "All" || p.category === category)
      && (!q || p.title.toLowerCase().includes(q) || (p.location_name ?? "").toLowerCase().includes(q)))
    .sort((a, b) =>
      (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)),
  [wishlist, category, q]);

  const unhide = (id: string) => setHidden((h) => h.filter((x) => x !== id));

  const removePlace = async (p: Place) => {
    setHidden((h) => [...h, p.id]);
    const { error } = await supabase.from("places").delete().eq("id", p.id);
    if (error) { unhide(p.id); setError(placeError(error.message)); } else refetch();
  };

  const donePlace = async (p: Place) => {
    setHidden((h) => [...h, p.id]);
    const msg = await markVisitedNow(p, places);
    if (msg) { unhide(p.id); setError(placeError(msg)); } else refetch();
  };

  const openFolder = openId ? folders.find((f) => f.id === openId) ?? null : null;
  if (openFolder) return <FolderView folder={openFolder} onBack={() => setOpenId(null)} />;

  const stat = (id: string) => {
    const mine = places.filter((p) => p.folder_id === id);
    const wish = mine.filter((p) => p.status === "wishlist").length;
    const visited = mine.length - wish;
    return `${wish} place${wish === 1 ? "" : "s"}${visited ? ` · ${visited} visited` : ""}`;
  };

  const viewed = places.find((p) => p.id === viewing) ?? null;
  const empty = visibleFolders.length === 0 && direct.length === 0;

  const chooseBtn = "glass flex w-full items-center gap-3 rounded-3xl p-4 text-left transition active:scale-[0.98]";

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setChooser(true)} aria-label="Add to your lists"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-wine-700/30 transition active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="glass flex items-center rounded-2xl px-3 focus-within:border-wine-600/40">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search folders or places"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
      </header>

      <CategoryTabs value={category} onChange={setCategory} categories={categories} />

      <div className="space-y-3 px-5">
        {error && <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200/70" />)}</div>
        ) : empty ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
            <FolderOpen className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
            {folders.length === 0 && wishlist.length === 0 ? "Nothing here yet. Tap + to add a direct item or a folder." : "No matches."}
          </div>
        ) : (
          <>
            {visibleFolders.length > 0 && (
              <ul className="space-y-3">
                {visibleFolders.map((f, idx) => {
                  const { Icon, bg, text } = styleFor(f.category);
                  return (
                    <motion.li key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 5) * 0.04 }}>
                      <button onClick={() => setOpenId(f.id)} className={chooseBtn}>
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 font-semibold">{f.title}</h3>
                          <p className="text-xs text-zinc-400">{f.category} · {stat(f.id)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-300" />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            {direct.length > 0 && (
              <>
                {visibleFolders.length > 0 && <p className="pt-2 text-xs font-semibold text-zinc-400">Places</p>}
                <p className="text-xs text-zinc-400">Swipe right to mark done, swipe left to delete.</p>
                <ul className="space-y-3">
                  {direct.map((p) => (
                    <ListItem key={p.id} place={p} onOpen={() => setViewing(p.id)}
                      onSwipeRight={() => donePlace(p)} onSwipeLeft={() => removePlace(p)} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {chooser && (
          <BottomSheet title="Add to your lists" onClose={() => setChooser(false)}>
            <div className="space-y-3">
              <button onClick={() => { setChooser(false); setAddingItem(true); }} className={chooseBtn}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white"><ListPlus className="h-6 w-6" /></span>
                <span>
                  <span className="block font-semibold">Direct item</span>
                  <span className="block text-xs text-zinc-500">Add a place straight to your list, no folder needed</span>
                </span>
              </button>
              <button onClick={() => { setChooser(false); setCreatingFolder(true); }} className={chooseBtn}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white"><FolderPlus className="h-6 w-6" /></span>
                <span>
                  <span className="block font-semibold">Add folder</span>
                  <span className="block text-xs text-zinc-500">Create a folder to group places together</span>
                </span>
              </button>
            </div>
          </BottomSheet>
        )}
        {creatingFolder && <FolderModal defaultCategory={category} onClose={() => setCreatingFolder(false)} onSaved={refetch} />}
        {addingItem && <PlaceFormModal mode="wishlist" defaultCategory={category} onClose={() => setAddingItem(false)} onSaved={refetch} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
