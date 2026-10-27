'use client';
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, fmtRange, inRange, monthRange, todayStr, weekRange, type DateRange } from "@/lib/dates";
import { normName, placeVisitDates } from "@/lib/places";
import { useData } from "../DataProvider";

type Mode = "all" | "month" | "week" | "range";
const MODES: { key: Mode; label: string }[] = [
  { key: "all", label: "All" }, { key: "month", label: "Monthly" },
  { key: "week", label: "Weekly" }, { key: "range", label: "Range" },
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
    return { period: { from: null, to: null }, label: mode === "range" ? "Pick two dates" : "All time" };
  }, [mode, offset, from, to]);

  const stats = useMemo(() => {
    const visited = places.filter((p) => p.status === "visited");
    const wish = places.filter((p) => p.status === "wishlist").length;
    const unbounded = !period.from && !period.to;
    const allNames = new Set(visited.map((p) => normName(p.title)));
    const inPeriod = new Set<string>();
    let events = 0;
    for (const p of visited) {
      const dates = placeVisitDates(p);
      const n = unbounded ? Math.max(1, dates.length) : dates.filter((d) => inRange(d, period)).length;
      if (n > 0) { events += n; inPeriod.add(normName(p.title)); }
    }
    const tracked = wish + allNames.size;
    return { wish, events, doneCount: inPeriod.size, tracked, pct: tracked ? Math.round((inPeriod.size / tracked) * 100) : 0 };
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
          <input type="date" value={from} max={todayStr()} onChange={(e) => setFrom(e.target.value)} aria-label="From date"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-wine-600" />
          <span className="text-zinc-400">–</span>
          <input type="date" value={to} max={todayStr()} onChange={(e) => setTo(e.target.value)} aria-label="To date"
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-wine-600" />
        </div>
      )}

      <div className="flex items-center justify-between">
        {arrows ? <button onClick={() => setOffset(offset - 1)} aria-label="Previous" className="rounded-full bg-white/70 p-1.5"><ChevronLeft className="h-4 w-4" /></button> : <span className="w-7" />}
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        {arrows ? <button onClick={() => setOffset(offset + 1)} aria-label="Next" className="rounded-full bg-white/70 p-1.5"><ChevronRight className="h-4 w-4" /></button> : <span className="w-7" />}
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-white/60 py-4">
          <p className="text-3xl font-extrabold text-wine-700">{stats.doneCount}</p>
          <p className="text-xs text-zinc-500">Visited places</p>
        </div>
        <div className="rounded-2xl bg-white/60 py-4">
          <p className="text-3xl font-extrabold text-wine-700">{stats.wish}</p>
          <p className="text-xs text-zinc-500">Remaining wishlist</p>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">Total dates in this period: <b className="text-zinc-700">{stats.events}</b></p>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-wine-700/10">
          <div className="h-full rounded-full bg-brand-bright transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">{stats.tracked ? `${stats.doneCount} of ${stats.tracked} places visited (${stats.pct}%)` : "No data yet"}</p>
      </div>
    </section>
  );
}