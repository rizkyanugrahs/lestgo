"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { MONTHS, fmtLong, todayStr } from "@/lib/dates";
import { placeVisitDates } from "@/lib/places";
import type { Place } from "@/lib/types";
import { useData } from "../DataProvider";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function CalendarTimeline({ onOpen }: { onOpen: (p: Place) => void }) {
  const { places } = useData();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  // date -> places visited that day (each visit entry sits on its own date)
  const byDate = useMemo(() => {
    const map = new Map<string, Place[]>();
    for (const p of places) for (const d of new Set(placeVisitDates(p))) {
      map.set(d, [...(map.get(d) ?? []), p]);
    }
    return map;
  }, [places]);

  const { y, m } = cursor;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = todayStr();
  const monthKey = `${y}-${pad(m + 1)}`;
  const monthCount = Array.from(byDate.entries()).filter(([d]) => d.startsWith(monthKey)).reduce((s, [, v]) => s + v.length, 0);

  const move = (delta: number) => {
    const d = new Date(y, m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(null);
  };

  const dayPlaces = selected ? byDate.get(selected) ?? [] : [];

  return (
    <section>
      <div className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => move(-1)} aria-label="Previous month" className="rounded-full bg-white/70 p-2"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-center">
            <p className="font-bold">{MONTHS[m]} {y}</p>
            <p className="text-xs text-zinc-400">{monthCount} {monthCount === 1 ? "date" : "dates"}</p>
          </div>
          <button onClick={() => move(1)} aria-label="Next month" className="rounded-full bg-white/70 p-2"><ChevronRight className="h-4 w-4" /></button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-zinc-400">
          {DAYS.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <span key={"e" + i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${y}-${pad(m + 1)}-${pad(day)}`;
            const list = byDate.get(ds);
            const photo = list?.find((p) => p.photos[0])?.photos[0];
            return (
              <button key={ds} onClick={() => list && setSelected(ds === selected ? null : ds)} disabled={!list}
                className={`relative aspect-square overflow-hidden rounded-xl text-xs font-semibold ${list ? (photo ? "bg-zinc-200" : "bg-wine-700/15 text-wine-700") : "text-zinc-500"} ${ds === today ? "ring-2 ring-wine-600" : ""} ${selected === ds ? "ring-2 ring-wine-900" : ""}`}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                {photo && <span className="absolute inset-0 bg-black/25" />}
                <span className={`relative ${photo ? "text-white drop-shadow" : ""}`}>{day}</span>
                {list && list.length > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{list.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && dayPlaces.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold text-zinc-600">{fmtLong(selected)}</p>
          {dayPlaces.map((p) => (
            <button key={p.id} onClick={() => onOpen(p)} className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-wine-700/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.photos[0] && <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />}
              </div>
              <span className="line-clamp-1 flex-1 font-semibold">{p.title}</span>
              {p.rating && <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
