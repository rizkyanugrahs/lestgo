"use client";
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { todayStr } from "@/lib/dates";
import { placeError, uploadMany } from "@/lib/places";
import type { Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import Stars from "../Stars";
import { useRoomId } from "../RoomProvider";
import { useMe } from "../MeProvider";
import PhotoPicker from "./PhotoPicker";

export default function CompleteVisitModal({ place, onClose, onSaved }: { place: Place; onClose: () => void; onSaved: () => void }) {
  const roomId = useRoomId();
  const { me } = useMe();
  const [date, setDate] = useState(todayStr());
  const [rating, setRating] = useState(0);
  const [love, setLove] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<string[]>(place.photos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const photos = files.length ? [...existing, ...(await uploadMany(files, roomId))] : existing;
      const { error } = await supabase.from("places").update({
        status: "visited", visited_date: date, rating: rating || null, photos,
        is_comfort_pick: love && !!me, comfort_pick_by: love ? me : null,
      }).eq("id", place.id);
      if (error) throw new Error(error.message);
      onSaved(); onClose();
    } catch (e) {
      setError(placeError(e instanceof Error ? e.message : "Terjadi kesalahan."));
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Selesai kencan!" onClose={onClose}>
      <div className="space-y-5">
        <p className="rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-700">Lengkapi kenangan di <b>{place.title}</b>.</p>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Foto</p>
          <PhotoPicker existing={existing} onExistingChange={setExisting} files={files} onFilesChange={setFiles} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Tanggal kunjungan</p>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())}
              className="rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Rating</p>
            <Stars value={rating} onChange={setRating} size={26} />
          </div>
        </div>
        <button type="button" onClick={() => setLove(!love)}
          className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${love ? "bg-rose-50 ring-2 ring-rose-300" : "bg-zinc-50"}`}>
          <Heart className={`h-6 w-6 ${love ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
          <span className="font-semibold">Jadikan Comfort Pick</span>
        </button>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button type="button" disabled={busy} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Tandai selesai
        </button>
      </div>
    </BottomSheet>
  );
}
