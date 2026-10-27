"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, ExternalLink, Heart, MapPin, Pencil, Repeat, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { linkLabel } from "@/lib/geo";
import { fmtLong, fmtShort } from "@/lib/dates";
import { placeMapsHref, placeVisitDates } from "@/lib/places";
import { styleFor } from "@/lib/categories";
import type { Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import Stars from "../Stars";
import { useData } from "../DataProvider";
import { ME_LABEL } from "../MeProvider";
import PlaceFormModal from "./PlaceFormModal";
import CompleteVisitModal from "./CompleteVisitModal";
import VisitAgainModal from "./VisitAgainModal";

export default function PlaceDetail({ place: p, onClose, onChanged }: { place: Place; onClose: () => void; onChanged: () => void }) {
  const { folders } = useData();
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [again, setAgain] = useState(false);
  const { Icon, bg, text } = styleFor(p.category);
  const isVisited = p.status === "visited";
  const folder = folders.find((f) => f.id === p.folder_id);
  const history = placeVisitDates(p).slice().sort().reverse();

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

  const cancelVisit = async () => {
    if (!window.confirm(`Batalkan kunjungan ke "${p.title}" dan kembalikan ke wishlist? Foto tetap tersimpan, tapi tanggal kunjungan, rating, dan hitungan kunjungan direset.`)) return;
    await supabase.from("places").update({
      status: "wishlist", visited_date: null, visit_dates: [], visit_count: 1,
      rating: null, is_comfort_pick: false, comfort_pick_by: null,
    }).eq("id", p.id);
    onChanged(); onClose();
  };

  const date = isVisited ? p.visited_date : p.planned_date;
  const actionBtn = "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-semibold";

  return (
    <BottomSheet title={p.title} onClose={onClose} tall>
      <div className="space-y-4">
        {p.photos.length > 0 ? (
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5">
            {p.photos.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt={p.title} className="aspect-[4/5] h-[46dvh] max-w-none shrink-0 snap-center rounded-2xl bg-zinc-100 object-cover shadow-md" />
            ))}
          </div>
        ) : (
          <div className={`flex h-40 items-center justify-center rounded-2xl ${bg}`}><Icon className={`h-12 w-12 ${text} opacity-60`} /></div>
        )}
        {p.photos.length > 1 && <p className="text-center text-xs text-zinc-400">{p.photos.length} foto, geser untuk melihat semua</p>}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}>{p.category}</span>
            {folder && <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-white/60">{folder.title}</span>}
            {isVisited && <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"><Repeat className="h-3 w-3" /> Dikunjungi {p.visit_count} kali</span>}
            {p.is_comfort_pick && <Heart className="h-5 w-5 fill-wine-600 text-wine-600" />}
          </div>
          {date && <p className="mt-2 text-sm text-zinc-500">{isVisited ? "Terakhir: " : "Rencana: "}{fmtLong(date)}</p>}
          {p.location_name && <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500"><MapPin className="h-3.5 w-3.5" />{p.location_name}</p>}
          {isVisited && <div className="mt-2">{p.rating ? <Stars value={p.rating} size={22} /> : <span className="text-sm text-zinc-400">Belum diberi rating</span>}</div>}
        </div>

        {p.is_comfort_pick && p.comfort_pick_by && (
          <p className="rounded-2xl bg-wine-700/10 px-4 py-2.5 text-sm text-wine-700">Comfort Pick {ME_LABEL[p.comfort_pick_by]}</p>
        )}

        {p.description && <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{p.description}</p>}

        {p.minus_notes && (
          <div className="rounded-2xl bg-zinc-100/80 px-4 py-3">
            <p className="mb-1 text-xs font-semibold text-zinc-500">Catatan minus</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-700">{p.minus_notes}</p>
          </div>
        )}

        {p.checklist.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500">Checklist</p>
            {p.checklist.map((c) => (
              <button key={c.id} onClick={() => toggleItem(c.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 text-left ring-1 ring-white/60">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${c.completed ? "border-transparent bg-brand text-white" : "border-zinc-300 text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>
                <span className={`text-sm ${c.completed ? "text-zinc-400 line-through" : ""}`}>{c.text}</span>
              </button>
            ))}
          </div>
        )}

        {history.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Riwayat kunjungan</p>
            <div className="flex flex-wrap gap-2">
              {history.map((d, i) => <span key={d + i} className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-white/60">{fmtShort(d)}</span>)}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <a href={placeMapsHref(p)} target="_blank" rel="noopener noreferrer"
            className={`${actionBtn} bg-brand text-white shadow-md shadow-wine-700/25`}><MapPin className="h-4 w-4" /> Buka lokasi</a>
          {p.social_link && (
            <a href={p.social_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/70 px-4 py-3 font-semibold text-zinc-700 ring-1 ring-white/60"><ExternalLink className="h-4 w-4" /> {linkLabel(p.social_link)}</a>
          )}
        </div>

        <div className="flex gap-3">
          {isVisited ? (
            <button onClick={() => setAgain(true)} className={`${actionBtn} bg-wine-700/10 text-wine-700`}><Repeat className="h-4 w-4" /> Kunjungi lagi</button>
          ) : (
            <button onClick={() => setCompleting(true)} className={`${actionBtn} bg-wine-700/10 text-wine-700`}><Check className="h-4 w-4" /> Selesai</button>
          )}
          <button onClick={() => setEditing(true)} className={`${actionBtn} bg-white/70 text-zinc-700 ring-1 ring-white/60`}><Pencil className="h-4 w-4" /> Edit</button>
        </div>

        <div className="flex gap-3">
          {isVisited && (
            <button onClick={cancelVisit} className={`${actionBtn} bg-white/70 text-zinc-600 ring-1 ring-white/60`}><RotateCcw className="h-4 w-4" /> Batalkan kunjungan</button>
          )}
          <button onClick={remove} aria-label="Hapus" className={`${isVisited ? "px-5" : "flex-1"} flex items-center justify-center gap-2 rounded-2xl bg-wine-700/10 py-3 font-semibold text-wine-600`}>
            <Trash2 className="h-5 w-5" />{!isVisited && " Hapus"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editing && <PlaceFormModal mode={p.status} place={p} onClose={() => setEditing(false)} onSaved={onChanged} />}
        {completing && <CompleteVisitModal place={p} onClose={() => setCompleting(false)} onSaved={onChanged} />}
        {again && <VisitAgainModal place={p} onClose={() => setAgain(false)} onSaved={onChanged} />}
      </AnimatePresence>
    </BottomSheet>
  );
}
