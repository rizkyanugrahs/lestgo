"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import type { Folder, Place } from "@/lib/types";
import { useData } from "../DataProvider";
import PlaceFormModal from "../places/PlaceFormModal";
import CompleteVisitModal from "../places/CompleteVisitModal";
import VisitAgainModal from "../places/VisitAgainModal";
import PlaceDetail from "../places/PlaceDetail";
import FolderModal from "./FolderModal";
import ListItem from "./ListItem";

/** Isi satu folder. folder = null berarti kumpulan tempat tanpa folder. */
export default function FolderView({ folder, onBack }: { folder: Folder | null; onBack: () => void }) {
  const { places, refetch } = useData();
  const [adding, setAdding] = useState(false);
  const [editingFolder, setEditingFolder] = useState(false);
  const [completing, setCompleting] = useState<Place | null>(null);
  const [again, setAgain] = useState<Place | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const items = useMemo(() => places
    .filter((p) => (folder ? p.folder_id === folder.id : !p.folder_id))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "wishlist" ? -1 : 1;
      return a.status === "wishlist"
        ? (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999") || +new Date(b.created_at) - +new Date(a.created_at)
        : (b.visited_date ?? "").localeCompare(a.visited_date ?? "");
    }), [places, folder]);

  const removePlace = async (p: Place) => {
    if (!window.confirm(`Hapus "${p.title}"?`)) return;
    await supabase.from("places").delete().eq("id", p.id);
    refetch();
  };

  const removeFolder = async () => {
    if (!folder) return;
    if (!window.confirm(`Hapus folder "${folder.title}"? Tempat di dalamnya tidak ikut terhapus, hanya jadi "Tanpa folder".`)) return;
    await supabase.from("list_folders").delete().eq("id", folder.id);
    refetch(); onBack();
  };

  const viewed = places.find((p) => p.id === viewing) ?? null;
  const { Icon, bg, text } = styleFor(folder?.category ?? "Other");

  return (
    <div className="px-5">
      <div className="flex items-center justify-between pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-zinc-500"><ArrowLeft className="h-4 w-4" /> Lists</button>
        {folder && (
          <div className="flex gap-1">
            <button onClick={() => setEditingFolder(true)} aria-label="Edit folder" className="rounded-full p-2 text-zinc-400"><Pencil className="h-4 w-4" /></button>
            <button onClick={removeFolder} aria-label="Hapus folder" className="rounded-full p-2 text-zinc-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
          {folder ? <Icon className={`h-6 w-6 ${text}`} /> : <FolderOpen className={`h-6 w-6 ${text}`} />}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">{folder?.title ?? "Tanpa folder"}</h1>
          <p className="text-xs font-medium text-zinc-400">{folder?.category ?? "Tempat yang belum dimasukkan ke folder"}</p>
        </div>
      </div>

      <button onClick={() => setAdding(true)}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98]">
        <Plus className="h-5 w-5" /> Tambah tempat
      </button>

      {items.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">Belum ada tempat di sini. Tambahkan yang pertama!</div>
      ) : (
        <>
          <p className="mb-2 text-xs text-zinc-400">Geser kanan untuk selesai atau kunjungi lagi, geser kiri untuk hapus.</p>
          <ul className="space-y-3">
            {items.map((p) => (
              <ListItem key={p.id} place={p} onOpen={() => setViewing(p.id)}
                onSwipeRight={() => (p.status === "visited" ? setAgain(p) : setCompleting(p))}
                onSwipeLeft={() => removePlace(p)} />
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {adding && <PlaceFormModal mode="wishlist" defaultFolderId={folder?.id ?? null} defaultCategory={folder?.category} onClose={() => setAdding(false)} onSaved={refetch} />}
        {editingFolder && folder && <FolderModal folder={folder} onClose={() => setEditingFolder(false)} onSaved={refetch} />}
        {completing && <CompleteVisitModal place={completing} onClose={() => setCompleting(null)} onSaved={refetch} />}
        {again && <VisitAgainModal place={again} onClose={() => setAgain(null)} onSaved={refetch} />}
        {viewed && <PlaceDetail place={viewed} onClose={() => setViewing(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
