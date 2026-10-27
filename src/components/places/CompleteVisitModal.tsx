'use client';
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { todayStr } from "@/lib/dates";
import { placeError, syncVisitCount, totalVisitsFor, uploadMany } from "@/lib/places";
import type { Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import Stars from "../Stars";
import { useData } from "../DataProvider";
import { useRoomId } from "../RoomProvider";
import { useMe } from "../MeProvider";
import PhotoPicker from "./PhotoPicker";

export default function CompleteVisitModal({ place, onClose, onSaved }: { place: Place; onClose: () => void; onSaved: () => void }) {
  const roomId = useRoomId();
  const { me } = useMe();
  const { places } = useData();
  const [date, setDate] = useState(todayStr());
  const [rating, setRating] = useState(0);
  const [minus, setMinus] = useState(place.minus_notes ?? "");
  const [love, setLove] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<string[]>(place.photos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const photos = files.length ? [...existing, ...(await uploadMany(files, roomId))] : existing;
      const total = totalVisitsFor(places, place.title, place.id);
      const { error } = await supabase.from("places").update({
        status: "visited", visited_date: date, visit_dates: [date], visit_count: total,
        rating: rating || null, minus_notes: minus.trim() || null, photos,
        is_comfort_pick: love && !!me, comfort_pick_by: love ? me : null,
      }).eq("id", place.id);
      if (error) throw new Error(error.message);
      await syncVisitCount(places, place.title, total, place.id);
      onSaved(); onClose();
    } catch (e) {
      setError(placeError(e instanceof Error ? e.message : "Something went wrong."));
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Date done!" onClose={onClose}>
      <div className="space-y-5">
        <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-700">Complete the memory at <b>{place.title}</b>.</p>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Photos</p>
          <PhotoPicker existing={existing} onExistingChange={setExisting} files={files} onFilesChange={setFiles} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Visit date</p>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())}
              className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Rating</p>
            <Stars value={rating} onChange={setRating} size={26} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Minus notes / downsides (optional)</p>
          <textarea value={minus} onChange={(e) => setMinus(e.target.value)} rows={2} placeholder="e.g. long queue, hard to park"
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-wine-600" />
        </div>
        <button type="button" onClick={() => setLove(!love)}
          className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${love ? "bg-wine-700/10 ring-2 ring-wine-600/50" : "bg-white/60 ring-1 ring-white/60"}`}>
          <Heart className={`h-6 w-6 ${love ? "fill-wine-600 text-wine-600" : "text-zinc-400"}`} />
          <span className="font-semibold">Add to Picks</span>
        </button>
        {error && <p className="text-sm text-wine-600">{error}</p>}
        <button type="button" disabled={busy} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Mark as done
        </button>
      </div>
    </BottomSheet>
  );
}