"use client";
import { memo, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { CalendarClock, Check, ExternalLink, ListChecks, MapPin, Trash2 } from "lucide-react";
import { linkLabel } from "@/lib/geo";
import { countdownLabel, daysUntil } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";

const TRIGGER = 90;

/** Swipe right = instant Done. Swipe left = instant Delete. No confirmation. */
function ListItem({ place: p, onOpen, onSwipeRight, onSwipeLeft }: {
  place: Place; onOpen: (p: Place) => void; onSwipeRight: (p: Place) => void; onSwipeLeft: (p: Place) => void;
}) {
  const controls = useAnimation();
  const dragged = useRef(false);
  const { Icon, bg, text } = styleFor(p.category);
  const done = p.checklist.filter((c) => c.completed).length;
  const n = p.planned_date ? daysUntil(p.planned_date) : null;

  return (
    <li className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-y-0 left-0 flex w-1/2 items-center gap-2 bg-brand pl-6 text-sm font-semibold text-white">
        <Check className="h-5 w-5" /> Done
      </div>
      <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end gap-2 bg-danger pr-6 text-sm font-semibold text-white">
        Delete <Trash2 className="h-5 w-5" />
      </div>

      <motion.div
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.45} animate={controls}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          if (info.offset.x > TRIGGER) onSwipeRight(p);
          else if (info.offset.x < -TRIGGER) onSwipeLeft(p);
          controls.start({ x: 0, transition: { type: "spring", stiffness: 420, damping: 36 } });
          setTimeout(() => { dragged.current = false; }, 80);
        }}
        className="relative flex gap-3 border border-zinc-100 bg-white p-3"
        style={{ touchAction: "pan-y" }}
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>

        <div className="min-w-0 flex-1">
          <button onClick={() => { if (!dragged.current) onOpen(p); }} className="block w-full text-left">
            <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
            {p.location_name && <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{p.location_name}</span></p>}
            {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{p.description}</p>}
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className={`rounded-full px-2 py-0.5 ${bg} ${text}`}>{p.category}</span>
            {n !== null && (
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${n === 0 ? "bg-brand text-white" : n < 0 ? "bg-zinc-100 text-zinc-500" : "bg-wine-700/10 text-wine-700"}`}>
                <CalendarClock className="h-3 w-3" /> {countdownLabel(n)}
              </span>
            )}
            {p.checklist.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600"><ListChecks className="h-3 w-3" /> {done}/{p.checklist.length}</span>
            )}
            {p.social_link && (
              <a href={p.social_link} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { if (dragged.current) e.preventDefault(); }}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                <ExternalLink className="h-3 w-3" /> {linkLabel(p.social_link)}
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </li>
  );
}

export default memo(ListItem);
