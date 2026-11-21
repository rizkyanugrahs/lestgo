"use client";
import { memo } from "react";
import { CalendarClock, ExternalLink, ListChecks, MapPin, Repeat } from "lucide-react";
import { linkLabel } from "@/lib/geo";
import { countdownLabel, daysUntil } from "@/lib/dates";
import { NEARBY, styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";

/** Wishlist card. Tap it to open the details (edit, mark as done, delete all live there). */
function ListItem({ place: p, onOpen, visits = 0 }: { place: Place; onOpen: (p: Place) => void; visits?: number }) {
  const { Icon, bg, text } = styleFor(p.category);
  const nearby = p.category === NEARBY;
  const done = p.checklist.filter((c) => c.completed).length;
  const n = !nearby && p.planned_date ? daysUntil(p.planned_date) : null;

  return (
    <li>
      <button onClick={() => onOpen(p)}
        className="flex w-full gap-3 rounded-3xl border border-zinc-100 bg-white p-3 text-left shadow-sm transition active:scale-[0.99]">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
          {p.location_name && <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{p.location_name}</span></p>}
          {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{p.description}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className={`rounded-full px-2 py-0.5 ${bg} ${text}`}>{nearby ? p.subcategory ?? NEARBY : p.category}</span>
            {nearby && visits > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-white"><Repeat className="h-3 w-3" /> Visited {visits}x</span>
            )}
            {n !== null && (
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${n === 0 ? "bg-brand text-white" : n < 0 ? "bg-zinc-100 text-zinc-500" : "bg-wine-700/10 text-wine-700"}`}>
                <CalendarClock className="h-3 w-3" /> {countdownLabel(n)}
              </span>
            )}
            {p.checklist.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600"><ListChecks className="h-3 w-3" /> {done}/{p.checklist.length}</span>
            )}
            {p.social_link && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                <ExternalLink className="h-3 w-3" /> {linkLabel(p.social_link)}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

export default memo(ListItem);
