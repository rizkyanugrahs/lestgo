'use client';
import { useMemo, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { todayStr } from "@/lib/dates";
import { latestDate, normName, placeError, syncVisitCount, totalVisitsFor, uploadMany } from "@/lib/places";
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

/**
 * place   = edit this entry.
 * prefill = start a NEW entry using details copied from an earlier visit ("Visit again").
 */
export default function PlaceFormModal({ mode, place, prefill, defaultCategory, defaultFolderId, onClose, onSaved }: {
  mode: "wishlist" | "visited"; place?: Place; prefill?: Place; defaultCategory?: string; defaultFolderId?: string | null;
  onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const { me } = useMe();
  const { categories, folders, places } = useData();
  const editing = !!place;
  const seed = place ?? prefill;
  const visited = (place?.status ?? mode) === "visited";

  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [folderId, setFolderId] = useState<string>(seed ? seed.folder_id ?? "" : defaultFolderId ?? "");
  const [category, setCategory] = useState<string>(seed?.category ?? (defaultCategory && defaultCategory !== "All" ? defaultCategory : categories[0]));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(place?.checklist ?? []);
  const [loc, setLoc] = useState<Loc>({ name: seed?.location_name ?? "", lat: seed?.latitude ?? null, lng: seed?.longitude ?? null, gmaps_url: seed?.gmaps_url ?? "" });
  const [social, setSocial] = useState(seed?.social_link ?? "");
  const [planned, setPlanned] = useState(place?.planned_date ?? "");
  const [visitedDate, setVisitedDate] = useState(place?.visited_date ?? todayStr());
  const [rating, setRating] = useState(place?.rating ?? 0);
  const [minus, setMinus] = useState(place?.minus_notes ?? "");
  const [love, setLove] = useState(place?.is_comfort_pick ?? false);
  const [existing, setExisting] = useState<string[]>(place?.photos ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete: earlier visited places that match what is being typed (new visit entries only)
  const suggestions = useMemo(() => {
    if (!visited || editing) return [];
    const q = normName(title);
    if (!q) return [];
    const byName = new Map<string, Place>();
    for (const p of places) {
      if (p.status !== "visited") continue;
      const k = normName(p.title);
      if (!k.includes(q)) continue;
      const cur = byName.get(k);
      if (!cur || (p.visited_date ?? "") > (cur.visited_date ?? "")) byName.set(k, p);
    }
    return Array.from(byName.values()).slice(0, 5);
  }, [places, title, visited, editing]);

  const priorVisits = visited && !editing && title.trim() ? totalVisitsFor(places, title) - 1 : 0;

  const pickSuggestion = (p: Place) => {
    setTitle(p.title);
    setCategory(p.category);
    setFolderId(p.folder_id ?? "");
    setLoc({ name: p.location_name ?? "", lat: p.latitude, lng: p.longitude, gmaps_url: p.gmaps_url ?? "" });
    setSocial(p.social_link ?? "");
    setDescription((d) => d || p.description || "");
    setShowSug(false);
  };

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
      let syncTotal: number | null = null;
      if (visited) {
        const photos = files.length ? [...existing, ...(await uploadMany(files, roomId))] : existing;
        const by = love ? (place?.is_comfort_pick && place.comfort_pick_by ? place.comfort_pick_by : me) : null;

        let dates = [...(place?.visit_dates ?? [])];
        const old = place?.visited_date;
        if (!editing || dates.length === 0) dates = [visitedDate];
        else if (old && old !== visitedDate) {
          const idx = dates.lastIndexOf(old);
          if (idx >= 0) dates[idx] = visitedDate; else dates.push(visitedDate);
        }

        // A new visit is always a NEW entry; visit_count is the running total for this place name
        const total = editing ? Math.max(place!.visit_count, dates.length) : totalVisitsFor(places, title);
        if (!editing) syncTotal = total;

        extra = {
          status: "visited", visited_date: latestDate(dates), visit_dates: dates, visit_count: total,
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
      if (syncTotal !== null) await syncVisitCount(places, title, syncTotal);
      onSaved(); onClose();
    } catch (e) {
      setError(placeError(e instanceof Error ? e.message : "Something went wrong."));
      setBusy(false);
    }
  };

  const heading = editing ? "Edit place" : visited ? "Add visited place" : "Add to wishlist";

  return (
    <BottomSheet title={heading} onClose={onClose}>
      <div className="space-y-5">
        {visited && (
          <div>
            <p className={label}>Date photos</p>
            <PhotoPicker existing={existing} onExistingChange={setExisting} files={files} onFilesChange={setFiles} />
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <input value={title} onChange={(e) => { setTitle(e.target.value); setShowSug(true); }}
              onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 150)}
              maxLength={150} placeholder="Place name" className={input} autoFocus={!editing && !prefill} />
            {showSug && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-xl backdrop-blur">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(s)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm active:bg-wine-700/10">
                      <span className="line-clamp-1 font-medium">{s.title}</span>
                      <span className="shrink-0 text-xs text-zinc-400">Visited {totalVisitsFor(places, s.title) - 1}x</span>
                    </button>
                  </li>
                ))}
                <li className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400">Not in the list? Keep typing to add a new place.</li>
              </ul>
            )}
          </div>
          {priorVisits > 0 && (
            <p className="rounded-2xl bg-wine-700/10 px-4 py-2.5 text-xs text-wine-700">
              You&apos;ve been here {priorVisits}x before. This will be visit #{priorVisits + 1}, saved as a new entry.
            </p>
          )}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description / notes" className={`${input} resize-none`} />
        </div>

        <div>
          <p className={label}>Folder</p>
          <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className={input}>
            <option value="">No folder</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        </div>

        <div>
          <p className={label}>Category</p>
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
                <p className={label}>Visit date</p>
                <input type="date" value={visitedDate} max={todayStr()} onChange={(e) => setVisitedDate(e.target.value || todayStr())}
                  className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
              </div>
              <div>
                <p className={label}>Rating</p>
                <Stars value={rating} onChange={setRating} size={26} />
              </div>
            </div>
            <div>
              <p className={label}>Minus notes / downsides (optional)</p>
              <textarea value={minus} onChange={(e) => setMinus(e.target.value)} rows={2} placeholder="e.g. long queue, hard to park, small portions"
                className={`${input} resize-none text-sm`} />
            </div>
          </>
        ) : (
          <div>
            <p className={label}>Planned visit date (optional)</p>
            <input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)}
              className="rounded-2xl border border-zinc-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-wine-600" />
            <p className="mt-1.5 text-xs text-zinc-400">If set, this place shows up on Home as the date gets close.</p>
          </div>
        )}

        <div>
          <p className={label}>{visited ? "What you ordered / did" : "Things to try"}</p>
          <ChecklistEditor items={checklist} onChange={setChecklist} placeholder={visited ? "e.g. Iced latte" : "e.g. Try the special fried rice"} />
        </div>

        <div>
          <p className={label}>Location</p>
          <LocationField value={loc} onChange={setLoc} autoDetect={visited && !editing && !seed} />
        </div>

        <div>
          <p className={label}>Social reference (optional)</p>
          <input value={social} onChange={(e) => setSocial(e.target.value)} inputMode="url" placeholder="TikTok / IG Reels / Threads link" className={`${input} text-sm`} />
        </div>

        {visited && (
          <button type="button" onClick={() => setLove(!love)}
            className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${love ? "bg-wine-700/10 ring-2 ring-wine-600/50" : "bg-white/60 ring-1 ring-white/60"}`}>
            <Heart className={`h-6 w-6 ${love ? "fill-wine-600 text-wine-600" : "text-zinc-400"}`} />
            <div>
              <p className="font-semibold">Add to Picks</p>
              <p className="text-xs text-zinc-500">
                {love
                  ? `Goes into ${place?.is_comfort_pick && place.comfort_pick_by ? ME_LABEL[place.comfort_pick_by] : me ? ME_LABEL[me] : "your"}'s Picks in Profile`
                  : "Mark this as a favorite you'd happily return to"}
              </p>
            </div>
          </button>
        )}

        {error && <p className="text-sm text-wine-600">{error}</p>}
        <button type="button" disabled={busy || !title.trim()} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Save"}
        </button>
      </div>
    </BottomSheet>
  );
}