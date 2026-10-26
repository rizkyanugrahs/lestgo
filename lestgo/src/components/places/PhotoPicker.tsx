"use client";
import { useEffect, useMemo } from "react";
import { ImagePlus, X } from "lucide-react";

export default function PhotoPicker({ existing, onExistingChange, files, onFilesChange, max = 10 }: {
  existing: string[]; onExistingChange: (urls: string[]) => void;
  files: File[]; onFilesChange: (files: File[]) => void; max?: number;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const total = existing.length + files.length;

  const thumb = (src: string, onRemove: () => void, key: string) => (
    <div key={key} className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button type="button" onClick={onRemove} aria-label="Hapus foto" className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {existing.map((u) => thumb(u, () => onExistingChange(existing.filter((x) => x !== u)), u))}
      {previews.map((u, i) => thumb(u, () => onFilesChange(files.filter((_, j) => j !== i)), u))}
      {total < max && (
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-zinc-300 text-xs font-medium text-zinc-500">
          <ImagePlus className="h-5 w-5" /> Foto
          <input type="file" accept="image/*" multiple hidden
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              onFilesChange([...files, ...picked].slice(0, max - existing.length));
              e.target.value = "";
            }} />
        </label>
      )}
    </div>
  );
}
