"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ExternalLink, MapPin, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { directionsUrl, linkLabel } from "@/lib/geo";
import type { Idea } from "@/lib/types";
import AddIdeaModal from "./AddIdeaModal";
import AddMemoryModal from "../memories/AddMemoryModal";

export type Folder = { id: string; title: string; description: string | null; category: string };

export default function FolderDetail({ folder, ideas, query, onBack, onChanged }: {
  folder: Folder; ideas: Idea[]; query: string; onBack: () => void; onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState<Idea | null>(null);
  const { Icon, bg, text } = styleFor(folder.category);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ideas
      .filter((i) => i.folder_id === folder.id)
      .filter((i) => !q || i.title.toLowerCase().includes(q) || (i.notes ?? "").toLowerCase().includes(q))
      .sort((a, b) => Number(a.is_visited) - Number(b.is_visited) || +new Date(b.created_at) - +new Date(a.created_at));
  }, [ideas, folder.id, query]);

  const toggleVisited = async (i: Idea) => {
    await supabase.from("ideas").update({ is_visited: !i.is_visited }).eq("id", i.id);
    onChanged();
    if (!i.is_visited) setLogging(i); // baru ditandai dikunjungi -> tawarkan catat kenangan
  };
  const removeIdea = async (i: Idea) => {
    if (!window.confirm(`Hapus "${i.title}"?`)) return;
    await supabase.from("ideas").delete().eq("id", i.id);
    onChanged();
  };
  const removeFolder = async () => {
    if (!window.confirm(`Hapus folder "${folder.title}" beserta semua idenya?`)) return;
    await supabase.from("list_folders").delete().eq("id", folder.id);
    onChanged(); onBack();
  };

  return (
    <div className="px-5">
      <div className="flex items-center justify-between pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-zinc-500"><ArrowLeft className="h-4 w-4" /> Lists</button>
        <button onClick={removeFolder} aria-label="Hapus folder" className="rounded-full p-2 text-zinc-400"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">{folder.title}</h1>
          <p className="text-xs font-medium text-zinc-400">{folder.category}</p>
          {folder.description && <p className="mt-1 text-sm text-zinc-500">{folder.description}</p>}
        </div>
      </div>

      <button onClick={() => setAdding(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white shadow-md shadow-violet-200 transition active:scale-[0.98]">
        <Plus className="h-5 w-5" /> Tambah ide
      </button>

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
          {query ? "Tidak ada ide yang cocok." : "Folder ini masih kosong. Tambahkan ide pertama kalian!"}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((i) => {
            const label = i.link ? linkLabel(i.link) : null;
            return (
              <li key={i.id} className={`flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-zinc-100 ${i.is_visited ? "opacity-60" : ""}`}>
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-violet-50">
                  {i.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-6 w-6 text-violet-200" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`line-clamp-1 font-semibold ${i.is_visited ? "line-through" : ""}`}>{i.title}</h3>
                  {i.location_name && (
                    <p className="flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{i.location_name}</span></p>
                  )}
                  {i.notes && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{i.notes}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {i.link && (
                      <a href={i.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                        <ExternalLink className="h-3 w-3" /> {label}
                      </a>
                    )}
                    {i.latitude !== null && i.longitude !== null && (
                      <a href={directionsUrl(i.latitude, i.longitude)} target="_blank" rel="noopener noreferrer"
                        className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700">Rute</a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-between">
                  <button onClick={() => toggleVisited(i)} aria-label={i.is_visited ? "Tandai belum dikunjungi" : "Tandai sudah dikunjungi"}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${i.is_visited ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-200 text-transparent"}`}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeIdea(i)} aria-label="Hapus ide" className="p-1 text-zinc-300"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {adding && <AddIdeaModal folderId={folder.id} onClose={() => setAdding(false)} onSaved={onChanged} />}
        {logging && (
          <AddMemoryModal
            prefill={{
              place_name: logging.title, category: folder.category, photo_url: logging.cover_url,
              place: logging.latitude !== null && logging.longitude !== null
                ? { name: logging.location_name ?? "Lokasi", lat: logging.latitude, lng: logging.longitude } : null,
            }}
            onClose={() => setLogging(null)} onSaved={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
