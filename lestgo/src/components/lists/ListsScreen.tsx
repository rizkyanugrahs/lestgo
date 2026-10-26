"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FolderOpen, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, styleFor } from "@/lib/categories";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import type { Idea } from "@/lib/types";
import { useRoomId } from "../RoomProvider";
import FolderModal from "./FolderModal";
import FolderDetail, { type Folder } from "./FolderDetail";

export default function ListsScreen() {
  const roomId = useRoomId();
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const folders = useRealtimeQuery<Folder & { created_at: string }>("list_folders", roomId, () =>
    supabase.from("list_folders").select("*").eq("room_id", roomId).order("created_at", { ascending: false })
  );
  const ideas = useRealtimeQuery<Idea>("ideas", roomId, () =>
    supabase.from("ideas").select("*").eq("room_id", roomId)
  );

  const refresh = () => { folders.refetch(); ideas.refetch(); };
  const openFolder = folders.data.find((f) => f.id === openId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders.data.filter((f) => {
      if (category !== "All" && f.category !== category) return false;
      if (!q) return true;
      const inFolder = f.title.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      const inIdeas = ideas.data.some((i) => i.folder_id === f.id && i.title.toLowerCase().includes(q));
      return inFolder || inIdeas;
    });
  }, [folders.data, ideas.data, category, query]);

  if (openFolder) {
    return <FolderDetail folder={openFolder} ideas={ideas.data} query="" onBack={() => setOpenId(null)} onChanged={refresh} />;
  }

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setCreating(true)} aria-label="Folder baru"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-200 transition active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center rounded-2xl bg-white px-3 shadow-sm ring-1 ring-zinc-100 focus-within:ring-violet-400">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari folder atau ide"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${category === c ? "bg-violet-600 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-100"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="px-5">
        {folders.loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200" />)}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
            <FolderOpen className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            {folders.data.length === 0 ? "Belum ada folder. Tekan tombol + untuk membuat yang pertama." : "Tidak ada folder yang cocok."}
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((f, idx) => {
              const { Icon, bg, text } = styleFor(f.category);
              const mine = ideas.data.filter((i) => i.folder_id === f.id);
              const done = mine.filter((i) => i.is_visited).length;
              return (
                <motion.li key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 5) * 0.04 }}>
                  <button onClick={() => setOpenId(f.id)}
                    className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-zinc-100 transition active:scale-[0.98]">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-semibold">{f.title}</h3>
                      <p className="text-xs text-zinc-400">{f.category} · {mine.length} ide{mine.length > 0 ? ` · ${done} dikunjungi` : ""}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-300" />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {creating && <FolderModal defaultCategory={category} onClose={() => setCreating(false)} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );
}
