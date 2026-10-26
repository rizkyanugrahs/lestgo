"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/storage";
import { CATEGORIES, styleFor } from "@/lib/categories";
import { todayStr } from "@/lib/dates";
import BottomSheet from "../BottomSheet";
import { useRoomId } from "../RoomProvider";
import LocationPicker, { type Place } from "../lists/LocationPicker";
import Stars from "./Stars";

export type MemoryPrefill = { place_name: string; category: string | null; photo_url: string | null; place: Place | null };

export default function AddMemoryModal({ prefill, onClose, onSaved }: {
  prefill?: MemoryPrefill; onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const [placeName, setPlaceName] = useState(prefill?.place_name ?? "");
  const [date, setDate] = useState(todayStr());
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string | null>(prefill?.category ?? null);
  const [place, setPlace] = useState<Place | null>(prefill?.place ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setFilePreview(null); return; }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const existing = prefill?.photo_url ?? null;
  const preview = filePreview ?? existing;

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const photo_url = file ? await uploadPhoto(file, roomId) : existing;
      if (!photo_url) throw new Error("Pilih foto dulu.");
      const { error } = await supabase.from("memories").insert({
        room_id: roomId, place_name: placeName.trim(), photo_url, visit_date: date,
        rating: rating || null, notes: notes.trim() || null, category,
        latitude: place?.lat ?? null, longitude: place?.lng ?? null,
      });
      if (error) throw new Error(error.message.includes("column") ? "Database belum diperbarui. Jalankan file supabase-fase3.sql di Supabase." : error.message);
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Catat kenangan" onClose={onClose}>
      <div className="space-y-4">
        {prefill && <p className="rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-700">Seru! Yuk catat kenangan dari tempat ini.</p>}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {preview ? (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Pratinjau" className="h-full w-full object-cover" />
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">Ganti foto</button>
            {file && <button onClick={() => setFile(null)} aria-label="Hapus foto" className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><X className="h-4 w-4" /></button>}
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-8 text-sm font-medium text-zinc-500">
            <ImagePlus className="h-5 w-5" /> Pilih foto kenangan
          </button>
        )}

        <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} maxLength={150} placeholder="Nama tempat"
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />

        <div className="flex items-center justify-between gap-3">
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500" />
          <Stars value={rating} onChange={setRating} size={26} />
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ceritakan kenangannya..."
          className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const { Icon } = styleFor(c);
              const on = category === c;
              return (
                <button key={c} onClick={() => setCategory(on ? null : c)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                  <Icon className="h-4 w-4" /> {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Lokasi (opsional)</p>
          <LocationPicker value={place} onChange={setPlace} />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button disabled={busy || !placeName.trim() || !preview} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan kenangan
        </button>
      </div>
    </BottomSheet>
  );
}
