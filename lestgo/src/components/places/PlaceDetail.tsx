"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Heart, MapPin, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { linkLabel } from "@/lib/geo";
import { fmtLong } from "@/lib/dates";
import { placeMapsHref } from "@/lib/places";
import { styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";
import Stars from "../Stars";
import { ME_LABEL } from "../MeProvider";
import PlaceFormModal from "./PlaceFormModal";

export default function PlaceDetail({ place: p, onClose, onChanged }: { place: Place; onClose: () => void; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const { Icon, bg, text } = styleFor(p.category);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggleItem = async (id: string) => {
    const next = p.checklist.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c));
    await supabase.from("places").update({ checklist: next }).eq("id", p.id);
    onChanged();
  };

  const remove = async () => {
    if (!window.confirm(`Hapus "${p.title}"?`)) return;
    await supabase.from("places").delete().eq("id", p.id);
    onChanged(); onClose();
  };

  const date = p.status === "visited" ? p.visited_date : p.planned_date;

  return (
    <motion.div className="fixed inset-0 z-[60] overflow-y-auto bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="relative bg-black">
        {p.photos.length > 0 ? (
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
            {p.photos.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt={p.title} className="max-h-[60dvh] w-full shrink-0 snap-center object-contain" />
            ))}
          </div>
        ) : (
          <div className={`flex h-48 items-center justify-center ${bg}`}><Icon className={`h-14 w-14 ${text} opacity-60`} /></div>
        )}
        {p.photos.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">{p.photos.length} foto, geser</span>}
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] rounded-full bg-black/60 p-2 text-white backdrop-blur"><X className="h-5 w-5" /></button>
      </div>

      <div className="mx-auto max-w-md space-y-4 px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight">{p.title}</h2>
            {p.is_comfort_pick && <Heart className="mt-1 h-5 w-5 shrink-0 fill-rose-500 text-rose-500" />}
          </div>
          {date && <p className="mt-1 text-sm text-zinc-500">{p.status === "visited" ? "" : "Rencana: "}{fmtLong(date)}</p>}
          {p.location_name && <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500"><MapPin className="h-3.5 w-3.5" />{p.location_name}</p>}
        </div>

        <div className="flex items-center justify-between">
          {p.rating ? <Stars value={p.rating} size={22} /> : <span className="text-sm text-zinc-400">{p.status === "visited" ? "Belum diberi rating" : "Wishlist"}</span>}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}>{p.category}</span>
        </div>

        {p.is_comfort_pick && p.comfort_pick_by && (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">Comfort Pick {ME_LABEL[p.comfort_pick_by]}</p>
        )}

        {p.description && <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{p.description}</p>}

        {p.checklist.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500">Checklist</p>
            {p.checklist.map((c) => (
              <button key={c.id} onClick={() => toggleItem(c.id)} className="flex w-full items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2.5 text-left">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${c.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>
                <span className={`text-sm ${c.completed ? "text-zinc-400 line-through" : ""}`}>{c.text}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <a href={placeMapsHref(p)} target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-semibold text-white"><MapPin className="h-4 w-4" /> Buka lokasi</a>
          {p.social_link && (
            <a href={p.social_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 font-semibold text-zinc-700"><ExternalLink className="h-4 w-4" /> {linkLabel(p.social_link)}</a>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3 font-semibold text-zinc-700"><Pencil className="h-4 w-4" /> Edit</button>
          <button onClick={remove} aria-label="Hapus" className="rounded-2xl bg-rose-50 px-5 text-rose-500"><Trash2 className="h-5 w-5" /></button>
        </div>
      </div>

      <AnimatePresence>
        {editing && <PlaceFormModal mode={p.status} place={p} onClose={() => setEditing(false)} onSaved={onChanged} />}
      </AnimatePresence>
    </motion.div>
  );
}
