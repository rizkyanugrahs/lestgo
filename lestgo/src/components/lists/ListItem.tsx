"use client";
import { useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { CalendarClock, Check, ExternalLink, ListChecks, MapPin, Trash2 } from "lucide-react";
import { linkLabel } from "@/lib/geo";
import { countdownLabel, daysUntil } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";

const OPEN_X = -96;

export default function ListItem({ place: p, onOpen, onDone, onDelete }: {
  place: Place; onOpen: () => void; onDone: () => void; onDelete: () => void;
}) {
  const controls = useAnimation();
  const [open, setOpen] = useState(false);
  const dragged = useRef(false);
  const { Icon, bg, text } = styleFor(p.category);

  const done = p.checklist.filter((c) => c.completed).length;
  const n = p.planned_date ? daysUntil(p.planned_date) : null;
  const isVisited = p.status === "visited";

  const guard = (fn: () => void) => () => {
    if (dragged.current) return;
    if (open) { setOpen(false); controls.start({ x: 0 }); return; }
    fn();
  };

  return (
    <li className="relative overflow-hidden rounded-3xl bg-rose-500">
      <button onClick={onDelete} aria-label="Hapus"
        className="absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-1 text-xs font-semibold text-white">
        <Trash2 className="h-5 w-5" /> Hapus
      </button>

      <motion.div
        drag="x" dragConstraints={{ left: OPEN_X, right: 0 }} dragElastic={0.05} animate={controls}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          const next = open ? info.offset.x < 48 : info.offset.x < -48;
          setOpen(next);
          controls.start({ x: next ? OPEN_X : 0, transition: { type: "spring", stiffness: 420, damping: 36 } });
          setTimeout(() => { dragged.current = false; }, 60);
        }}
        className="relative flex gap-3 bg-white p-3 ring-1 ring-zinc-100"
        style={{ touchAction: "pan-y" }}
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-6 w-6 ${text}`} /></div>

        <div className="min-w-0 flex-1">
          <button onClick={guard(onOpen)} className="block w-full text-left">
            <h3 className={`line-clamp-1 font-semibold ${isVisited ? "text-zinc-500" : ""}`}>{p.title}</h3>
            {p.location_name && <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3 shrink-0" /><span className="line-clamp-1">{p.location_name}</span></p>}
            {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{p.description}</p>}
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
            <span className={`rounded-full px-2 py-0.5 ${bg} ${text}`}>{p.category}</span>
            {!isVisited && n !== null && (
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${n === 0 ? "bg-amber-100 text-amber-700" : n < 0 ? "bg-zinc-100 text-zinc-500" : "bg-violet-100 text-violet-700"}`}>
                <CalendarClock className="h-3 w-3" /> {countdownLabel(n)}
              </span>
            )}
            {p.checklist.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600"><ListChecks className="h-3 w-3" /> {done}/{p.checklist.length}</span>
            )}
            {p.social_link && (
              <a href={p.social_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                <ExternalLink className="h-3 w-3" /> {linkLabel(p.social_link)}
              </a>
            )}
          </div>
        </div>

        {isVisited ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-emerald-500 text-white"><Check className="h-5 w-5" /></span>
        ) : (
          <button onClick={guard(onDone)} aria-label="Tandai sudah dikunjungi"
            className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border-2 border-zinc-200 text-zinc-300 transition active:border-emerald-500 active:text-emerald-500">
            <Check className="h-5 w-5" />
          </button>
        )}
      </motion.div>
    </li>
  );
}
