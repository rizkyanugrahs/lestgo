"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { directionsUrl } from "@/lib/geo";
import { fmtLong } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import type { Memory } from "@/lib/types";
import Stars from "./Stars";

export default function MemoryDetail({ memory: m, onClose, onChanged }: { memory: Memory; onClose: () => void; onChanged: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const mapsHref = m.latitude !== null && m.longitude !== null
    ? directionsUrl(m.latitude, m.longitude)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.place_name)}`;

  const remove = async () => {
    if (!window.confirm(`Hapus kenangan "${m.place_name}"?`)) return;
    await supabase.from("memories").delete().eq("id", m.id);
    onChanged(); onClose();
  };

  const cat = m.category ? styleFor(m.category) : null;

  return (
    <motion.div className="fixed inset-0 z-[60] overflow-y-auto bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="relative bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.photo_url} alt={m.place_name} className="mx-auto max-h-[65dvh] w-full object-contain" />
        <button onClick={onClose} aria-label="Tutup"
          className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] rounded-full bg-black/60 p-2 text-white backdrop-blur"><X className="h-5 w-5" /></button>
      </div>
      <div className="mx-auto max-w-md space-y-4 px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-5">
        <div>
          <h2 className="text-xl font-bold leading-tight">{m.place_name}</h2>
          <p className="mt-1 text-sm text-zinc-500">{fmtLong(m.visit_date)}</p>
        </div>
        <div className="flex items-center justify-between">
          {m.rating ? <Stars value={m.rating} size={22} /> : <span className="text-sm text-zinc-400">Belum diberi rating</span>}
          {cat && m.category && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cat.bg} ${cat.text}`}>{m.category}</span>}
        </div>
        {m.notes && <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{m.notes}</p>}
        <div className="flex gap-3 pt-2">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-semibold text-white"><MapPin className="h-4 w-4" /> Buka lokasi</a>
          <button onClick={remove} aria-label="Hapus kenangan" className="rounded-2xl bg-rose-50 px-4 text-rose-500"><Trash2 className="h-5 w-5" /></button>
        </div>
      </div>
    </motion.div>
  );
}
