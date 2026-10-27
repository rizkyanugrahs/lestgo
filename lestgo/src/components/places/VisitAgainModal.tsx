"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { todayStr } from "@/lib/dates";
import { latestDate, placeError, placeVisitDates, uploadMany } from "@/lib/places";
import type { Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import { useRoomId } from "../RoomProvider";
import PhotoPicker from "./PhotoPicker";

export default function VisitAgainModal({ place, onClose, onSaved }: { place: Place; onClose: () => void; onSaved: () => void }) {
  const roomId = useRoomId();
  const [date, setDate] = useState(todayStr());
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const photos = files.length ? [...place.photos, ...(await uploadMany(files, roomId))] : place.photos;
      const dates = [...placeVisitDates(place), date];
      const { error } = await supabase.from("places").update({
        visit_dates: dates, visit_count: Math.max(place.visit_count, dates.length - 1) + 1,
        visited_date: latestDate(dates), photos,
      }).eq("id", place.id);
      if (error) throw new Error(error.message);
      onSaved(); onClose();
    } catch (e) {
      setError(placeError(e instanceof Error ? e.message : "Terjadi kesalahan."));
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Kunjungi lagi" onClose={onClose}>
      <div className="space-y-5">
        <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-700">
          Catat kunjungan ke-{place.visit_count + 1} di <b>{place.title}</b>.
        </p>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Tanggal kunjungan</p>
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())}
            className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Foto baru (opsional)</p>
          <PhotoPicker existing={[]} onExistingChange={() => {}} files={files} onFilesChange={setFiles} />
        </div>
        {error && <p className="text-sm text-wine-600">{error}</p>}
        <button type="button" disabled={busy} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan kunjungan
        </button>
      </div>
    </BottomSheet>
  );
}
