"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { styleFor } from "@/lib/categories";
import { placeError } from "@/lib/places";
import type { Folder } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import { useData } from "../DataProvider";
import { useRoomId } from "../RoomProvider";

export default function FolderModal({ folder, defaultCategory, onClose, onSaved }: {
  folder?: Folder; defaultCategory?: string; onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const { categories } = useData();
  const [name, setName] = useState(folder?.title ?? "");
  const [category, setCategory] = useState<string>(folder?.category ?? (defaultCategory && defaultCategory !== "All" ? defaultCategory : categories[0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    const payload = { title: name.trim(), category };
    const res = folder
      ? await supabase.from("list_folders").update(payload).eq("id", folder.id)
      : await supabase.from("list_folders").insert({ room_id: roomId, ...payload });
    if (res.error) { setError(placeError(res.error.message)); setBusy(false); return; }
    onSaved(); onClose();
  };

  return (
    <BottomSheet title={folder ? "Edit folder" : "New folder"} onClose={onClose}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus
          placeholder="Folder name, e.g. Cafes in Bandung"
          className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 outline-none focus:border-wine-600" />
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const { Icon } = styleFor(c);
              const on = category === c;
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${on ? "bg-brand text-white" : "bg-white/70 text-zinc-600 ring-1 ring-white/60"}`}>
                  <Icon className="h-4 w-4" /> {c}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-wine-600">{error}</p>}
        <button disabled={busy || !name.trim()} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {folder ? "Save" : "Create folder"}
        </button>
      </div>
    </BottomSheet>
  );
}
