"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, styleFor } from "@/lib/categories";
import BottomSheet from "../BottomSheet";
import { useRoomId } from "../RoomProvider";

export default function FolderModal({ defaultCategory, onClose, onSaved }: {
  defaultCategory?: string; onClose: () => void; onSaved: () => void;
}) {
  const roomId = useRoomId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory && defaultCategory !== "All" ? defaultCategory : CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.from("list_folders").insert({
      room_id: roomId, title: title.trim(), description: description.trim() || null, category,
    });
    if (error) { setError(error.message); setBusy(false); return; }
    onSaved(); onClose();
  };

  return (
    <BottomSheet title="Folder baru" onClose={onClose}>
      <div className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} autoFocus
          placeholder="Nama folder, mis. Kafe di Bandung"
          className="w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          placeholder="Deskripsi singkat (opsional)"
          className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-violet-500" />
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const { Icon } = styleFor(c);
              const on = category === c;
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${on ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                  <Icon className="h-4 w-4" /> {c}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <button disabled={busy || !title.trim()} onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Buat folder
        </button>
      </div>
    </BottomSheet>
  );
}
