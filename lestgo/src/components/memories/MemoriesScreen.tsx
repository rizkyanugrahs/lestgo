"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, Camera, Heart, Images, Star, X } from "lucide-react";
import { fmtRange, fmtShort, inRange, type DateRange } from "@/lib/dates";
import { placeVisitDates } from "@/lib/places";
import { styleFor } from "@/lib/categories";
import { useData } from "../DataProvider";
import CategoryTabs from "../CategoryTabs";
import PlaceDetail from "../places/PlaceDetail";
import VisitBadge from "../VisitBadge";
import FlashbackSlideshow from "./FlashbackSlideshow";
import DateRangePicker from "./DateRangePicker";

export default function MemoriesScreen() {
  const { places, loading, refetch, roomInfo, categories } = useData();
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [picking, setPicking] = useState(false);
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const visited = useMemo(
    () => places.filter((p) => p.status === "visited" && p.visited_date)
      .sort((a, b) => b.visited_date!.localeCompare(a.visited_date!) || +new Date(b.created_at) - +new Date(a.created_at)),
    [places]
  );

  const top5 = useMemo(() => visited.filter((p) => p.rating === 5).slice(0, 5), [visited]);

  const filtering = !!range.from || category !== "All";
  const filtered = useMemo(() => visited.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (range.from && !placeVisitDates(p).some((d) => inRange(d, range))) return false;
    return true;
  }), [visited, range, category]);

  const now = new Date();
  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isAnniversary = !!roomInfo.anniversary_date && roomInfo.anniversary_date.slice(5) === md;
  const anniYears = roomInfo.anniversary_date ? now.getFullYear() - parseInt(roomInfo.anniversary_date.slice(0, 4), 10) : 0;

  const opened = places.find((p) => p.id === openId) ?? null;

  return (
    <div>
      <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Memories</h1>
          <button onClick={() => setPicking(true)} aria-label="Filter tanggal"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 ${range.from ? "bg-brand text-white shadow-md shadow-wine-700/30" : "glass text-wine-700"}`}>
            <CalendarDays className="h-5 w-5" />
          </button>
        </div>
        {range.from && (
          <button onClick={() => setRange({ from: null, to: null })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-wine-700/10 px-3 py-1.5 text-xs font-semibold text-wine-700">
            {fmtRange(range)} <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <CategoryTabs value={category} onChange={setCategory} categories={categories} />

      <div className="space-y-5 px-5">
        {isAnniversary && !filtering && (
          <div className="relative overflow-hidden rounded-3xl bg-brand-bright p-5 text-white shadow-lg shadow-wine-700/30">
            <Heart className="absolute -right-4 -top-4 h-28 w-28 fill-white/15 text-white/15" />
            <p className="text-xs font-semibold text-white/80">Hari ini</p>
            <h3 className="mt-1 text-xl font-bold">{anniYears > 0 ? `Selamat anniversary ke-${anniYears}!` : "Selamat anniversary!"}</h3>
            <p className="mt-1 text-sm text-white/85">Rayakan dengan makan malam atau jalan-jalan berdua.</p>
          </div>
        )}

        {!filtering && !loading && <FlashbackSlideshow items={top5} onOpen={(p) => setOpenId(p.id)} />}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-200/70" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
            <Camera className="mx-auto mb-2 h-6 w-6 text-wine-700/40" />
            {visited.length === 0 ? "Kenangan muncul otomatis dari tempat yang kalian kunjungi. Tekan + untuk mencatat." : "Tidak ada kenangan yang cocok dengan filter."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => {
              const { Icon } = styleFor(p.category);
              return (
                <button key={p.id} onClick={() => setOpenId(p.id)}
                  className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-100 text-left shadow-sm transition active:scale-[0.97]">
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand"><Icon className="h-10 w-10 text-white/40" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <span className="absolute left-2 top-2 rounded-full border border-white/40 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur">{fmtShort(p.visited_date!)}</span>
                  <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    {p.rating && <span className="flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</span>}
                    {p.photos.length > 1 && <span className="flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white"><Images className="h-3 w-3" />{p.photos.length}</span>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <VisitBadge count={p.visit_count} className="mb-1" />
                    <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{p.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {picking && <DateRangePicker value={range} onApply={(r) => { setRange(r); setPicking(false); }} onClose={() => setPicking(false)} />}
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
