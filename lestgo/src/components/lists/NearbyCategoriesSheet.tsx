"use client";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { placeError } from "@/lib/places";
import BottomSheet from "../BottomSheet";
import { useData } from "../DataProvider";
import { useRoomId } from "../RoomProvider";

/** Add, rename or delete the sub-categories used inside Nearby (saved to your room, so both phones share them). */
export default function NearbyCategoriesSheet({ onClose }: { onClose: () => void }) {
  const roomId = useRoomId();
  const { nearbyCategories: subs, saveSettings, refetch } = useData();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exists = (name: string, except?: string) =>
    subs.some((c) => c.toLowerCase() === name.toLowerCase() && c !== except);

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setError(null);
    const msg = await fn();
    if (msg) setError(placeError(msg));
    setBusy(false);
  };

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (exists(name)) { setError("That sub-category already exists."); return; }
    run(async () => {
      const msg = await saveSettings({ nearby_categories: [...subs, name] });
      if (!msg) setNewName("");
      return msg;
    });
  };

  const rename = (old: string) => {
    const name = editText.trim();
    if (!name || name === old) { setEditing(null); return; }
    if (exists(name, old)) { setError("That sub-category already exists."); return; }
    run(async () => {
      // places that used the old name follow the new one
      const r = await supabase.from("places").update({ subcategory: name }).eq("room_id", roomId).eq("subcategory", old);
      if (r.error) return r.error.message;
      const msg = await saveSettings({ nearby_categories: subs.map((c) => (c === old ? name : c)) });
      if (!msg) { setEditing(null); refetch(); }
      return msg;
    });
  };

  const remove = (name: string) => {
    if (!window.confirm(`Delete the sub-category "${name}"? Its places stay in Nearby, they just lose this label.`)) return;
    run(async () => {
      const r = await supabase.from("places").update({ subcategory: null }).eq("room_id", roomId).eq("subcategory", name);
      if (r.error) return r.error.message;
      const msg = await saveSettings({ nearby_categories: subs.filter((c) => c !== name) });
      if (!msg) refetch();
      return msg;
    });
  };

  return (
    <BottomSheet title="Nearby sub-categories" onClose={onClose}>
      <div className="space-y-4">
        {subs.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-4 py-3 text-sm text-zinc-500 ring-1 ring-white/60">No sub-categories yet. Add the first one below.</p>
        ) : (
          <ul className="space-y-2">
            {subs.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-white/60">
                {editing === c ? (
                  <>
                    <input value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={30} autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") rename(c); }}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    <button onClick={() => rename(c)} aria-label="Save" className="rounded-full bg-brand p-1.5 text-white"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditing(null)} aria-label="Cancel" className="p-1.5 text-zinc-400"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{c}</span>
                    <button onClick={() => { setEditing(c); setEditText(c); setError(null); }} aria-label={`Rename ${c}`} className="p-1.5 text-zinc-400"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c)} aria-label={`Delete ${c}`} className="p-1.5 text-zinc-400"><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30} placeholder="New sub-category, e.g. Dessert"
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
          <button onClick={add} disabled={busy || !newName.trim()} aria-label="Add sub-category"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white disabled:opacity-40">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>

        {error && <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}
      </div>
    </BottomSheet>
  );
}
