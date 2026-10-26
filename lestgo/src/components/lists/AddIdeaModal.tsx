"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/storage";
import { parseMapsLink } from "@/lib/geo";
import BottomSheet from "../BottomSheet";
import { useRoomId } from "../RoomProvider";
import LocationPicker, { type Place } from "./LocationPicker";

export default function AddIdeaModal({ folderId, onClose, onSaved }: {
  folderId: string; onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkHint, setLinkHint] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onLinkChange = (v: string) => {
    setLink(v);
    setLinkHint(null);
    const c = parseMapsLink(v);
    if (c && !place) {
      setPlace({ name: "Lokasi dari link Google Maps", lat: c.lat, lng: c.lng });
      setLinkHint("Lokasi otomatis diambil dari link.");
    } else if (/goo\.gl|maps\.app/i.test(v) && !c) {
      setLinkHint("Link pendek tidak bisa dibaca otomatis. Cari lokasinya manual di bawah.");
    }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const cover_url = file ? await uploadPhoto(file, roomId) : null;
      const { error } = await supabase.from("ideas").insert({
        folder_id: folderId, room_id: roomId, title: title.trim(),
        notes: notes.trim() || null, link: link.trim() || null,
        location_name: place?.name ?? null, latitude: place?.lat ?? null, longitude: place?.lng ?? null,
        cover_url,
      });
      if (error) throw new Error(error.message);
      onSaved(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Tambah ide" onClose={onClose}>
      <div className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} autoFocus
          placeholder="Mau ngapain / ke mana?"
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan (opsional)"
          className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />
        <div>
          <input value={link} onChange={(e) => onLinkChange(e.target.value)} inputMode="url"
            placeholder="Tempel link TikTok / Google Maps (opsional)"
            className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-violet-500" />
          {linkHint && <p className="mt-1.5 text-xs text-zinc-500">{linkHint}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Lokasi</p>
          <LocationPicker value={place} onChange={setPlace} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Foto sampul</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {preview ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pratinjau" className="h-full w-full object-cover" />
              <button onClick={() => setFile(null)} aria-label="Hapus foto" className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-6 text-sm font-medium text-zinc-500">
              <ImagePlus className="h-5 w-5" /> Pilih foto
            </button>
          )}
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button disabled={busy || !title.trim()} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan ide
        </button>
      </div>
    </BottomSheet>
  );
}
