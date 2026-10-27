"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, fmtRange, inRange, monthRange, todayStr, weekRange, type DateRange } from "@/lib/dates";
import { placeVisitDates } from "@/lib/places";
import { useData } from "../DataProvider";

type Mode = "all" | "month" | "week" | "range";
const MODES: { key: Mode; label: string }[] = [
  { key: "all", label: "All" }, { key: "month", label: "Bulanan" },
  { key: "week", label: "Mingguan" }, { key: "range", label: "Rentang" },
];

export default function StatsCard() {
  const { places } = useData();
  const [mode, setMode] = useState<Mode>("all");
  const [offset, setOffset] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { period, label } = useMemo<{ period: DateRange; label: string }>(() => {
    const now = new Date();
    if (mode === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return { period: monthRange(d.getFullYear(), d.getMonth()), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
    }
    if (mode === "week") { const r = weekRange(offset); return { period: r, label: fmtRange(r) }; }
    if (mode === "range" && from && to) { const r = from <= to ? { from, to } : { from: to, to: from }; return { period: r, label: fmtRange(r) }; }
    return { period: { from: null, to: null }, label: mode === "range" ? "Pilih dua tanggal" : "Sepanjang waktu" };
  }, [mode, offset, from, to]);

  const stats = useMemo(() => {
    const visited = places.filter((p) => p.status === "visited");
    const wish = places.filter((p) => p.status === "wishlist").length;
    let events = 0, doneCount = 0;
    for (const p of visited) {
      const n = placeVisitDates(p).filter((d) => inRange(d, period)).length;
      if (n > 0) { events += n; doneCount++; }
    }
    const tracked = wish + visited.length;
    return { wish, events, doneCount, tracked, pct: tracked ? Math.round((doneCount / tracked) * 100) : 0 };
  }, [places, period]);

  const arrows = mode === "month" || mode === "week";

  return (
    <section className="glass space-y-4 rounded-3xl p-4">
      <div className="flex rounded-full bg-white/50 p-1">
        {MODES.map((m) => (
          <button key={m.key} onClick={() => { setMode(m.key); setOffset(0); }}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${mode === m.key ? "bg-brand text-white shadow" : "text-zinc-500"}`}>{m.label}</button>
        ))}
      </div>

      {mode === "range" && (
        <div className="flex items-center gap-2">
          <input type="date" value={from} max={todayStr()} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-wine-600" />
          <span className="text-zinc-400">–</span>
          <input type="date" value={to} max={todayStr()} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-wine-600" />
        </div>
      )}

      <div className="flex items-center justify-between">
        {arrows ? <button onClick={() => setOffset(offset - 1)} aria-label="Sebelumnya" className="rounded-full bg-white/70 p-1.5"><ChevronLeft className="h-4 w-4" /></button> : <span className="w-7" />}
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        {arrows ? <button onClick={() => setOffset(offset + 1)} aria-label="Berikutnya" className="rounded-full bg-white/70 p-1.5"><ChevronRight className="h-4 w-4" /></button> : <span className="w-7" />}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/60 py-3"><p className="text-2xl font-extrabold text-wine-700">{stats.doneCount}</p><p className="text-[11px] text-zinc-500">Tempat dikunjungi</p></div>
        <div className="rounded-2xl bg-white/60 py-3"><p className="text-2xl font-extrabold text-wine-700">{stats.events}</p><p className="text-[11px] text-zinc-500">Total kencan</p></div>
        <div className="rounded-2xl bg-white/60 py-3"><p className="text-2xl font-extrabold text-wine-700">{stats.wish}</p><p className="text-[11px] text-zinc-500">Wishlist tersisa</p></div>
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-wine-700/10">
          <div className="h-full rounded-full bg-brand-bright transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">{stats.tracked ? `${stats.doneCount} dari ${stats.tracked} tempat sudah dikunjungi (${stats.pct}%)` : "Belum ada data"}</p>
      </div>
    </section>
  );
}
