'use client';
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import PhotoCropper from "./PhotoCropper";

/** Pick photos; each one opens in the 4:5 cropper (zoom, pan, rotate). */
export default function PhotoPicker({ existing, onExistingChange, files, onFilesChange, max = 10 }: {
  existing: string[]; onExistingChange: (urls: string[]) => void;
  files: File[]; onFilesChange: (files: File[]) => void; max?: number;
}) {
  const [queue, setQueue] = useState<File[]>([]);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const total = existing.length + files.length;

  const thumb = (src: string, onRemove: () => void, key: string) => (
    <div key={key} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button type="button" onClick={onRemove} aria-label="Remove photo" className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {existing.map((u) => thumb(u, () => onExistingChange(existing.filter((x) => x !== u)), u))}
        {previews.map((u, i) => thumb(u, () => onFilesChange(files.filter((_, j) => j !== i)), u))}
        {total + queue.length < max && (
          <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-wine-700/30 bg-white/50 text-xs font-medium text-wine-700">
            <ImagePlus className="h-5 w-5" /> Add
            <input type="file" accept="image/*" multiple hidden
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).slice(0, max - total - queue.length);
                setQueue((q) => [...q, ...picked]);
                e.target.value = "";
              }} />
          </label>
        )}
      </div>

      <AnimatePresence>
        {queue[0] && (
          <PhotoCropper
            key={queue[0].name + queue[0].size + queue[0].lastModified}
            file={queue[0]}
            onDone={(f) => { onFilesChange([...files, f]); setQueue((q) => q.slice(1)); }}
            onCancel={() => setQueue((q) => q.slice(1))}
          />
        )}
      </AnimatePresence>
    </>
  );
}