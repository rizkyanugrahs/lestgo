"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from "lucide-react";
import { newId, type PhotoItem } from "@/lib/places";
import PhotoCropper from "./PhotoCropper";

/**
 * Photos for a visit. Every new photo opens in the 4:5 cropper first.
 * The first photo is the cover; use the arrows or the star to change the order.
 */
export default function PhotoPicker({ items, onChange, max = 10 }: {
  items: PhotoItem[]; onChange: (items: PhotoItem[]) => void; max?: number;
}) {
  const [queue, setQueue] = useState<File[]>([]);
  const cache = useRef(new Map<string, string>());

  // preview address for a new (not yet uploaded) photo, created once per photo
  const srcOf = (it: PhotoItem) => {
    if (it.url) return it.url;
    let u = cache.current.get(it.id);
    if (!u) { u = URL.createObjectURL(it.file!); cache.current.set(it.id, u); }
    return u;
  };

  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    cache.current.forEach((u, id) => { if (!ids.has(id)) { URL.revokeObjectURL(u); cache.current.delete(id); } });
  }, [items]);

  useEffect(() => {
    const store = cache.current;
    return () => { store.forEach((u) => URL.revokeObjectURL(u)); store.clear(); };
  }, []);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  const small = "flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white disabled:opacity-30";

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it, i) => (
          <div key={it.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={srcOf(it)} alt="" decoding="async" className="h-full w-full object-cover" />
            <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${i === 0 ? "bg-brand text-white" : "bg-black/55 text-white"}`}>
              {i === 0 ? "Cover" : i + 1}
            </span>
            <button type="button" onClick={() => onChange(items.filter((x) => x.id !== it.id))} aria-label="Remove photo"
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
            {items.length > 1 && (
              <div className="absolute inset-x-1 bottom-1.5 flex items-center justify-between">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className={small}><ChevronLeft className="h-4 w-4" /></button>
                {i > 0 && (
                  <button type="button" onClick={() => move(i, 0)} aria-label="Set as cover" className={small}><Star className="h-3.5 w-3.5" /></button>
                )}
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move later" className={small}><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        ))}
        {items.length + queue.length < max && (
          <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-wine-700/30 bg-white/50 text-xs font-medium text-wine-700">
            <ImagePlus className="h-5 w-5" /> Add
            <input type="file" accept="image/*" multiple hidden
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).slice(0, max - items.length - queue.length);
                setQueue((q) => [...q, ...picked]);
                e.target.value = "";
              }} />
          </label>
        )}
      </div>
      {items.length > 1 && <p className="mt-2 text-xs text-zinc-400">The first photo is the cover. Use the arrows or the star to reorder.</p>}

      <AnimatePresence>
        {queue[0] && (
          <PhotoCropper
            key={queue[0].name + queue[0].size + queue[0].lastModified}
            file={queue[0]}
            onDone={(f) => { onChange([...items, { id: newId(), file: f }]); setQueue((q) => q.slice(1)); }}
            onCancel={() => setQueue((q) => q.slice(1))}
          />
        )}
      </AnimatePresence>
    </>
  );
}
