"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, Images, Star } from "lucide-react";
import { CATEGORIES, styleFor } from "@/lib/categories";
import { MONTHS, fmtShort } from "@/lib/dates";
import { useData } from "../DataProvider";
import PlaceDetail from "../places/PlaceDetail";
import OnThisDay from "./OnThisDay";

const selectCls = "rounded-full bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-100 outline-none";

export default function MemoriesScreen() {
  const { places, loading, refetch, roomInfo } = useData();
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const visited = useMemo(
    () => places.filter((p) => p.status === "visited" && p.visited_date)
      .sort((a, b) => b.visited_date!.localeCompare(a.visited_date!) || +new Date(b.created_at) - +new Date(a.created_at)),
    [places]
  );
  const years = useMemo(() => Array.from(new Set(visited.map((p) => p.visited_date!.slice(0, 4)))).sort().reverse(), [visited]);

  const filtered = useMemo(() => visited.filter((p) => {
    const d = p.visited_date!;
    if (year !== "all" && d.slice(0, 4) !== year) return false;
    if (month !== "all" && parseInt(d.slice(5, 7), 10) !== parseInt(month, 10)) return false;
    if (category !== "All" && p.category !== category) return false;
    return true;
  }), [visited, year, month, category]);

  const opened = places.find((p) => p.id === openId) ?? null;
  const filtering = year !== "all" || month !== "all" || category !== "All";

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">Memories</h1>
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
        {!filtering && !loading && <OnThisDay places={places} anniversary={roomInfo.anniversary_date} onOpen={(p) => setOpenId(p.id)} />}

        {loading ? (
          <div className="columns-2 gap-3">{[160, 220, 200, 150].map((h, i) => <div key={i} style={{ height: h }} className="mb-3 animate-pulse rounded-2xl bg-zinc-200" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
            <Camera className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            {visited.length === 0 ? "Kenangan muncul otomatis dari tempat yang kalian kunjungi. Tekan + untuk mencatat." : "Tidak ada kenangan yang cocok dengan filter."}
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {filtered.map((p) => {
              const { Icon, bg, text } = styleFor(p.category);
              return (
                <button key={p.id} onClick={() => setOpenId(p.id)}
                  className="relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-zinc-100 text-left shadow-sm transition active:scale-[0.97]">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.title} loading="lazy" className="block h-auto w-full" />
                  ) : (
                    <div className={`flex h-40 w-full items-center justify-center ${bg}`}><Icon className={`h-10 w-10 ${text} opacity-50`} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">{fmtShort(p.visited_date!)}</span>
                  <div className="absolute right-2 top-2 flex gap-1">
                    {p.photos.length > 1 && <span className="flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"><Images className="h-3 w-3" />{p.photos.length}</span>}
                    {p.rating && <span className="flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</span>}
                  </div>
                  <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-xs font-semibold leading-tight text-white">{p.title}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
