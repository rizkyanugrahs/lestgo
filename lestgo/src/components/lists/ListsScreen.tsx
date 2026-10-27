"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FolderOpen, FolderPlus, Search } from "lucide-react";
import { styleFor } from "@/lib/categories";
import { useData } from "../DataProvider";
import CategoryTabs from "../CategoryTabs";
import FolderModal from "./FolderModal";
import FolderView from "./FolderView";

export default function ListsScreen() {
  const { folders, places, loading, categories, refetch } = useData();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null); // id folder, atau "none"
  const [creating, setCreating] = useState(false);

  const q = query.trim().toLowerCase();

  const visibleFolders = useMemo(() => folders.filter((f) => {
    if (category !== "All" && f.category !== category) return false;
    if (!q) return true;
    return f.title.toLowerCase().includes(q)
      || places.some((p) => p.folder_id === f.id && p.title.toLowerCase().includes(q));
  }), [folders, places, category, q]);

  const loose = useMemo(() => places.filter((p) =>
    !p.folder_id
    && (category === "All" || p.category === category)
    && (!q || p.title.toLowerCase().includes(q))), [places, category, q]);

  const openFolder = openId && openId !== "none" ? folders.find((f) => f.id === openId) ?? null : null;
  if (openId === "none" || openFolder) {
    return <FolderView folder={openFolder} onBack={() => setOpenId(null)} />;
  }

  const stat = (id: string | null) => {
    const mine = places.filter((p) => (id ? p.folder_id === id : !p.folder_id));
    const done = mine.filter((p) => p.status === "visited").length;
    return `${mine.length} tempat${mine.length ? ` · ${done} dikunjungi` : ""}`;
  };

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your lists</h1>
          <button onClick={() => setCreating(true)} aria-label="Folder baru"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-wine-700/30 transition active:scale-95">
            <FolderPlus className="h-5 w-5" />
          </button>
        </div>
        <div className="glass flex items-center rounded-2xl px-3 focus-within:border-wine-600/40">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari folder atau tempat"
            className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
      </header>

      <CategoryTabs value={category} onChange={setCategory} categories={categories} />

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-zinc-200/70" />)}</div>
        ) : visibleFolders.length === 0 && loose.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
            <FolderOpen className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
            {folders.length === 0 && places.length === 0 ? "Belum ada folder. Tekan tombol di kanan atas untuk membuat yang pertama." : "Tidak ada yang cocok."}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleFolders.map((f, idx) => {
              const { Icon, bg, text } = styleFor(f.category);
              return (
                <motion.li key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 5) * 0.04 }}>
                  <button onClick={() => setOpenId(f.id)}
                    className="glass flex w-full items-center gap-3 rounded-3xl p-4 text-left transition active:scale-[0.98]">
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
            {loose.length > 0 && (
              <li>
                <button onClick={() => setOpenId("none")}
                  className="glass flex w-full items-center gap-3 rounded-3xl p-4 text-left transition active:scale-[0.98]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100"><FolderOpen className="h-6 w-6 text-zinc-500" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">Tanpa folder</h3>
                    <p className="text-xs text-zinc-400">{stat(null)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-300" />
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {creating && <FolderModal defaultCategory={category} onClose={() => setCreating(false)} onSaved={refetch} />}
      </AnimatePresence>
    </div>
  );
}
