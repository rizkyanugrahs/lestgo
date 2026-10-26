"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, Plus, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import { MONTHS, fmtShort } from "@/lib/dates";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import type { Memory } from "@/lib/types";
import { useRoomId } from "../RoomProvider";
import AddMemoryModal from "./AddMemoryModal";
import MemoryDetail from "./MemoryDetail";
import OnThisDay from "./OnThisDay";

const selectCls = "rounded-full bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-100 outline-none";

export default function MemoriesScreen() {
  const roomId = useRoomId();
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("All");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);

  const mem = useRealtimeQuery<Memory>("memories", roomId, () =>
    supabase.from("memories").select("*").eq("room_id", roomId)
      .order("visit_date", { ascending: false }).order("created_at", { ascending: false })
  );

  useEffect(() => {
    supabase.from("rooms").select("anniversary_date").eq("id", roomId).maybeSingle()
      .then(({ data }) => setAnniversary(data?.anniversary_date ?? null));
  }, [roomId]);

  const years = useMemo(
    () => Array.from(new Set(mem.data.map((m) => m.visit_date.slice(0, 4)))).sort().reverse(),
    [mem.data]
  );

  const filtered = useMemo(() => mem.data.filter((m) => {
    if (year !== "all" && m.visit_date.slice(0, 4) !== year) return false;
    if (month !== "all" && parseInt(m.visit_date.slice(5, 7), 10) !== parseInt(month, 10)) return false;
    if (category !== "All" && m.category !== category) return false;
    return true;
  }), [mem.data, year, month, category]);

  const opened = mem.data.find((m) => m.id === openId) ?? null;
  const filtering = year !== "all" || month !== "all" || category !== "All";

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Memories</h1>
          <button onClick={() => setAdding(true)} aria-label="Catat kenangan"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-200 transition active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls} aria-label="Bulan">
            <option value="all">Semua bulan</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls} aria-label="Tahun">
            <option value="all">Semua tahun</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
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

      <div className="space-y-5 px-5">
        {!filtering && !mem.loading && <OnThisDay memories={mem.data} anniversary={anniversary} onOpen={(m) => setOpenId(m.id)} />}

        {mem.loading ? (
          <div className="columns-2 gap-3">{[160, 220, 200, 150].map((h, i) => <div key={i} style={{ height: h }} className="mb-3 animate-pulse rounded-2xl bg-zinc-200" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
            <Camera className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            {mem.data.length === 0 ? "Belum ada kenangan. Tekan + untuk mencatat yang pertama." : "Tidak ada kenangan yang cocok dengan filter."}
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {filtered.map((m) => (
              <button key={m.id} onClick={() => setOpenId(m.id)}
                className="relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-zinc-100 text-left shadow-sm transition active:scale-[0.97]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photo_url} alt={m.place_name} loading="lazy" className="block h-auto w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">{fmtShort(m.visit_date)}</span>
                {m.rating && (
                  <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {m.rating}
                  </span>
                )}
                <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-xs font-semibold leading-tight text-white">{m.place_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {adding && <AddMemoryModal onClose={() => setAdding(false)} onSaved={mem.refetch} />}
        {opened && <MemoryDetail memory={opened} onClose={() => setOpenId(null)} onChanged={mem.refetch} />}
      </AnimatePresence>
    </div>
  );
}
