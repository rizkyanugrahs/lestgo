"use client";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { markVisitedNow, placeError } from "@/lib/places";
import type { Folder, Place } from "@/lib/types";
import { useData } from "../DataProvider";
import PlaceFormModal from "../places/PlaceFormModal";
import PlaceDetail from "../places/PlaceDetail";
import FolderModal from "./FolderModal";
import ListItem from "./ListItem";

/** Wishlist places inside one folder. Visited places are not shown here. */
export default function FolderView({ folder, onBack }: { folder: Folder; onBack: () => void }) {
  const { places, refetch } = useData();
  const [adding, setAdding] = useState(false);
  const [editingFolder, setEditingFolder] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => places
    .filter((p) => p.folder_id === folder.id && p.status === "wishlist" && !hidden.includes(p.id))
    .sort((a, b) =>
      (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)),
  [places, folder.id, hidden]);

  const removePlace = useCallback(async (p: Place) => {
    setHidden((h) => [...h, p.id]);
    const { error } = await supabase.from("places").delete().eq("id", p.id);
    if (error) { setHidden((h) => h.filter((x) => x !== p.id)); setError(placeError(error.message)); } else refetch();
  }, [refetch]);

  const donePlace = useCallback(async (p: Place) => {
    setHidden((h) => [...h, p.id]);
    const msg = await markVisitedNow(p, places);
    if (msg) { setHidden((h) => h.filter((x) => x !== p.id)); setError(placeError(msg)); } else refetch();
  }, [places, refetch]);

  const openPlace = useCallback((p: Place) => setViewing(p.id), []);

  const removeFolder = async () => {
    if (!window.confirm(`Delete folder "${folder.title}"? The places inside are not deleted, they just move out of the folder.`)) return;
    await supabase.from("list_folders").delete().eq("id", folder.id);
    refetch(); onBack();
  };

  const viewed = places.find((p) => p.id === viewing) ?? null;
  const { Icon, bg, text } = styleFor(folder.category);

  return (
    <div className="px-5">
      <div className="flex items-center justify-between pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-zinc-500"><ArrowLeft className="h-4 w-4" /> Lists</button>
        <div className="flex gap-1">
          <button onClick={() => setEditingFolder(true)} aria-label="Edit folder" className="rounded-full p-2 text-zinc-400"><Pencil className="h-4 w-4" /></button>
          <button onClick={removeFolder} aria-label="Delete folder" className="rounded-full p-2 text-zinc-400"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">{folder.title}</h1>
          <p className="text-xs font-medium text-zinc-400">{folder.category}</p>
        </div>
      </div>

      <button onClick={() => setAdding(true)}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98]">
        <Plus className="h-5 w-5" /> Add place
      </button>

      {error && <p className="mb-3 rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}

      {items.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">No places here yet. Add the first one!</div>
      ) : (
        <>
          <p className="mb-2 text-xs text-zinc-400">Swipe right to mark done, swipe left to delete.</p>
          <ul className="space-y-3">
            {items.map((p) => (
              <ListItem key={p.id} place={p} onOpen={openPlace} onSwipeRight={donePlace} onSwipeLeft={removePlace} />
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {adding && <PlaceFormModal mode="wishlist" defaultFolderId={folder.id} defaultCategory={folder.category} onClose={() => setAdding(false)} onSaved={refetch} />}
        {editingFolder && <FolderModal folder={folder} onClose={() => setEditingFolder(false)} onSaved={refetch} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
