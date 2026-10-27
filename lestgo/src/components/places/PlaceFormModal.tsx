"use client";
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { todayStr } from "@/lib/dates";
import { latestDate, placeError, uploadMany } from "@/lib/places";
import type { ChecklistItem, Place } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import Stars from "../Stars";
import { useData } from "../DataProvider";
import { useRoomId } from "../RoomProvider";
import { ME_LABEL, useMe } from "../MeProvider";
import ChecklistEditor from "./ChecklistEditor";
import LocationField, { type Loc } from "./LocationField";
import PhotoPicker from "./PhotoPicker";

const label = "mb-2 text-sm font-medium text-zinc-500";
const input = "w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 outline-none focus:border-wine-600";

export default function PlaceFormModal({ mode, place, defaultCategory, defaultFolderId, onClose, onSaved }: {
  mode: "wishlist" | "visited"; place?: Place; defaultCategory?: string; defaultFolderId?: string | null;
  onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const { me } = useMe();
  const { categories, folders } = useData();
  const editing = !!place;
  const visited = (place?.status ?? mode) === "visited";

  const [title, setTitle] = useState(place?.title ?? "");
  const [description, setDescription] = useState(place?.description ?? "");
  const [folderId, setFolderId] = useState<string>(place ? place.folder_id ?? "" : defaultFolderId ?? "");
  const [category, setCategory] = useState<string>(place?.category ?? (defaultCategory && defaultCategory !== "All" ? defaultCategory : categories[0]));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(place?.checklist ?? []);
  const [loc, setLoc] = useState<Loc>({ name: place?.location_name ?? "", lat: place?.latitude ?? null, lng: place?.longitude ?? null, gmaps_url: place?.gmaps_url ?? "" });
  const [social, setSocial] = useState(place?.social_link ?? "");
  const [planned, setPlanned] = useState(place?.planned_date ?? "");
  const [visitedDate, setVisitedDate] = useState(place?.visited_date ?? todayStr());
  const [rating, setRating] = useState(place?.rating ?? 0);
  const [minus, setMinus] = useState(place?.minus_notes ?? "");
  const [love, setLove] = useState(place?.is_comfort_pick ?? false);
  const [existing, setExisting] = useState<string[]>(place?.photos ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const base = {
        title: title.trim(), description: description.trim() || null, category,
        folder_id: folderId || null,
        location_name: loc.name.trim() || null, gmaps_url: loc.gmaps_url.trim() || null,
        latitude: loc.lat, longitude: loc.lng, social_link: social.trim() || null, checklist,
      };
      let extra: Record<string, unknown>;
      if (visited) {
        const photos = files.length ? [...existing, ...(await uploadMany(files, roomId))] : existing;
        const by = love ? (place?.is_comfort_pick && place.comfort_pick_by ? place.comfort_pick_by : me) : null;

        // catatan tanggal kunjungan (termasuk kunjungan ulang)
        let dates = [...(place?.visit_dates ?? [])];
        const old = place?.visited_date;
        if (dates.length === 0) dates = [visitedDate];
        else if (old && old !== visitedDate) {
          const idx = dates.lastIndexOf(old);
          if (idx >= 0) dates[idx] = visitedDate; else dates.push(visitedDate);
        }
        extra = {
          status: "visited", visited_date: latestDate(dates), visit_dates: dates,
          visit_count: Math.max(place?.visit_count ?? 1, dates.length),
          rating: rating || null, minus_notes: minus.trim() || null, photos,
          is_comfort_pick: love && !!by, comfort_pick_by: by,
        };
      } else {
        extra = { status: "wishlist", planned_date: planned || null };
      }
      const res = editing
        ? await supabase.from("places").update({ ...base, ...extra }).eq("id", place!.id)
        : await supabase.from("places").insert({ room_id: roomId, ...base, ...extra });
      if (res.error) throw new Error(res.error.message);
      onSaved(); onClose();
    } catch (e) {
      setError(placeError(e instanceof Error ? e.message : "Terjadi kesalahan."));
      setBusy(false);
    }
  };

  const heading = editing ? "Edit tempat" : visited ? "Tambah tempat dikunjungi" : "Tambah ke wishlist";

  return (
    <BottomSheet title={heading} onClose={onClose}>
      <div className="space-y-5">
        {visited && (
          <div>
            <p className={label}>Foto kencan</p>
            <PhotoPicker existing={existing} onExistingChange={setExisting} files={files} onFilesChange={setFiles} />
          </div>
        )}

        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="Nama tempat" className={input} autoFocus={!editing} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Deskripsi / catatan" className={`${input} resize-none`} />
        </div>

        <div>
          <p className={label}>Folder</p>
          <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className={input}>
            <option value="">Tanpa folder</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        </div>

        <div>
          <p className={label}>Kategori</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const { Icon } = styleFor(c);
              const on = category === c;
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? "bg-brand text-white" : "bg-white/70 text-zinc-600 ring-1 ring-white/60"}`}>
                  <Icon className="h-4 w-4" /> {c}
                </button>
              );
            })}
          </div>
        </div>

        {visited ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={label}>Tanggal kunjungan</p>
                <input type="date" value={visitedDate} max={todayStr()} onChange={(e) => setVisitedDate(e.target.value || todayStr())}
                  className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
              </div>
              <div>
                <p className={label}>Rating</p>
                <Stars value={rating} onChange={setRating} size={26} />
              </div>
            </div>
            <div>
              <p className={label}>Catatan minus / kekurangan (opsional)</p>
              <textarea value={minus} onChange={(e) => setMinus(e.target.value)} rows={2} placeholder="Mis. antre lama, parkir susah, porsi kecil"
                className={`${input} resize-none text-sm`} />
            </div>
          </>
        ) : (
          <div>
            <p className={label}>Tanggal rencana kunjungan (opsional)</p>
            <input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
            <p className="mt-1.5 text-xs text-zinc-400">Kalau diisi, tempat ini muncul di Home saat harinya dekat.</p>
          </div>
        )}

        <div>
          <p className={label}>{visited ? "Yang dipesan / dilakukan" : "Yang mau dicoba"}</p>
          <ChecklistEditor items={checklist} onChange={setChecklist} placeholder={visited ? "Mis. Kopi susu" : "Mis. Coba nasi goreng spesial"} />
        </div>

        <div>
          <p className={label}>Lokasi</p>
          <LocationField value={loc} onChange={setLoc} autoDetect={visited && !editing} />
        </div>

        <div>
          <p className={label}>Referensi sosmed (opsional)</p>
          <input value={social} onChange={(e) => setSocial(e.target.value)} inputMode="url" placeholder="Link TikTok / IG Reels / Threads" className={`${input} text-sm`} />
        </div>

        {visited && (
          <button type="button" onClick={() => setLove(!love)}
            className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${love ? "bg-wine-700/10 ring-2 ring-wine-600/50" : "bg-white/60 ring-1 ring-white/60"}`}>
            <Heart className={`h-6 w-6 ${love ? "fill-wine-600 text-wine-600" : "text-zinc-400"}`} />
            <div>
              <p className="font-semibold">Comfort Pick</p>
              <p className="text-xs text-zinc-500">
                {love
                  ? `Masuk ke Picks ${place?.is_comfort_pick && place.comfort_pick_by ? ME_LABEL[place.comfort_pick_by] : me ? ME_LABEL[me] : ""} di Profile`
                  : "Tandai kalau ini tempat favoritmu yang bakal didatangi lagi"}
              </p>
            </div>
          </button>
        )}

        {error && <p className="text-sm text-wine-600">{error}</p>}
        <button type="button" disabled={busy || !title.trim()} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Simpan perubahan" : "Simpan"}
        </button>
      </div>
    </BottomSheet>
  );
}
