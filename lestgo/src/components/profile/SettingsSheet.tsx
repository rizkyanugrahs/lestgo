"use client";
import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Camera, Check, Copy, GripVertical, Loader2, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/storage";
import { placeError } from "@/lib/places";
import { todayStr } from "@/lib/dates";
import type { PersonKey } from "@/lib/types";
import BottomSheet from "../BottomSheet";
import { useData } from "../DataProvider";
import { useRoom, useRoomId } from "../RoomProvider";
import { ME_LABEL, useMe } from "../MeProvider";

const card = "rounded-3xl bg-white/60 p-4 ring-1 ring-white/60";
const head = "mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400";

function CategoryRow({ name, editing, editText, onEditText, onStartEdit, onSave, onCancel, onDelete, onDragEnd }: {
  name: string; editing: boolean; editText: string; onEditText: (v: string) => void;
  onStartEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void; onDragEnd: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={name} dragListener={false} dragControls={controls} onDragEnd={onDragEnd}
      className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-white/60">
      <button type="button" onPointerDown={(e) => controls.start(e)} aria-label={`Reorder ${name}`}
        className="shrink-0 cursor-grab touch-none p-1 text-zinc-400"><GripVertical className="h-4 w-4" /></button>
      {editing ? (
        <>
          <input value={editText} onChange={(e) => onEditText(e.target.value)} maxLength={30} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button onClick={onSave} aria-label="Save" className="rounded-full bg-brand p-1.5 text-white"><Check className="h-4 w-4" /></button>
          <button onClick={onCancel} aria-label="Cancel" className="p-1.5 text-zinc-400"><X className="h-4 w-4" /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{name}</span>
          <button onClick={onStartEdit} aria-label={`Rename ${name}`} className="p-1.5 text-zinc-400"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} aria-label={`Delete ${name}`} className="p-1.5 text-zinc-400"><Trash2 className="h-4 w-4" /></button>
        </>
      )}
    </Reorder.Item>
  );
}

export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const roomId = useRoomId();
  const { room, unpair } = useRoom();
  const { me, setMe } = useMe();
  const { roomInfo, categories, saveSettings, refetch } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [order, setOrder] = useState<string[]>(categories);
  const orderRef = useRef<string[]>(categories);

  useEffect(() => { setOrder(categories); orderRef.current = categories; }, [categories]);

  const copy = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setError(null);
    const msg = await fn();
    if (msg) setError(placeError(msg));
    setBusy(false);
  };

  const changePhoto = (file: File) => run(async () => {
    try { return await saveSettings({ couple_photo_url: await uploadPhoto(file, roomId) }); }
    catch (e) { return e instanceof Error ? e.message : "Couldn't change the photo."; }
  });

  const exists = (name: string, except?: string) =>
    categories.some((c) => c.toLowerCase() === name.toLowerCase() && c !== except);

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (exists(name)) { setError("That category already exists."); return; }
    run(async () => {
      const msg = await saveSettings({ categories: [...categories, name] });
      if (!msg) setNewCat("");
      return msg;
    });
  };

  const renameCategory = (old: string) => {
    const name = editText.trim();
    if (!name || name === old) { setEditing(null); return; }
    if (exists(name, old)) { setError("That category already exists."); return; }
    run(async () => {
      // every place and folder using the old name is renamed too
      const p = await supabase.from("places").update({ category: name }).eq("room_id", roomId).eq("category", old);
      if (p.error) return p.error.message;
      const f = await supabase.from("list_folders").update({ category: name }).eq("room_id", roomId).eq("category", old);
      if (f.error) return f.error.message;
      const msg = await saveSettings({ categories: categories.map((c) => (c === old ? name : c)) });
      if (!msg) { setEditing(null); refetch(); }
      return msg;
    });
  };

  const deleteCategory = (name: string) => {
    if (categories.length <= 1) { setError("Keep at least one category."); return; }
    if (!window.confirm(`Delete the category "${name}"? Places and folders that use it keep the name, but they will only show up under All.`)) return;
    run(() => saveSettings({ categories: categories.filter((c) => c !== name) }));
  };

  // The order is saved when the drag ends and drives Lists, Memories and the forms
  const saveOrder = () => {
    const next = orderRef.current;
    if (next.join("\u0000") === categories.join("\u0000")) return;
    run(() => saveSettings({ categories: next }));
  };

  const leave = () => {
    if (window.confirm("Leave this room? You'll need the room code to get back in. Your data is not deleted.")) { onClose(); unpair(); }
  };

  return (
    <BottomSheet title="Settings" onClose={onClose} tall>
      <div className="space-y-4">
        <div className={card}>
          <p className={head}>Partner room ID</p>
          <button onClick={copy} className="flex w-full items-center justify-between rounded-2xl bg-wine-700/10 px-4 py-3">
            <span className="font-mono text-xl font-bold tracking-widest text-wine-700">{room?.code}</span>
            {copied ? <Check className="h-5 w-5 text-wine-700" /> : <Copy className="h-5 w-5 text-wine-700/60" />}
          </button>
        </div>

        <div className={card}>
          <p className={head}>Couple photo</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) changePhoto(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex w-full items-center gap-3 text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand">
              {roomInfo.couple_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={roomInfo.couple_photo_url} alt="" className="h-full w-full object-cover" />
              ) : <Camera className="h-5 w-5 text-white" />}
            </span>
            <span className="flex-1 text-sm font-semibold">Change photo</span>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-wine-700" />}
          </button>
        </div>

        <div className={card}>
          <p className={head}>Anniversary date</p>
          <input type="date" max={todayStr()} value={roomInfo.anniversary_date ?? ""}
            onChange={(e) => { if (e.target.value) run(() => saveSettings({ anniversary_date: e.target.value })); }}
            className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 outline-none focus:border-wine-600" />
        </div>

        <div className={card}>
          <p className={head}>Categories</p>
          <Reorder.Group axis="y" values={order} onReorder={(v) => { orderRef.current = v; setOrder(v); }} className="space-y-2">
            {order.map((c) => (
              <CategoryRow key={c} name={c}
                editing={editing === c} editText={editText} onEditText={setEditText}
                onStartEdit={() => { setEditing(c); setEditText(c); setError(null); }}
                onSave={() => renameCategory(c)} onCancel={() => setEditing(null)}
                onDelete={() => deleteCategory(c)} onDragEnd={saveOrder} />
            ))}
          </Reorder.Group>
          <div className="mt-3 flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={30} placeholder="New category"
              onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
            <button onClick={addCategory} disabled={busy || !newCat.trim()} aria-label="Add category"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white disabled:opacity-40"><Plus className="h-5 w-5" /></button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Drag the handle to reorder. This order is used in Lists and Memories. Renaming a category also renames it on all places and folders.</p>
        </div>

        <div className={card}>
          <p className={head}>On this device you are</p>
          <div className="flex rounded-full bg-white/60 p-1">
            {(["kiky", "safina"] as PersonKey[]).map((k) => (
              <button key={k} onClick={() => setMe(k)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${me === k ? "bg-brand text-white shadow" : "text-zinc-500"}`}>{ME_LABEL[k]}</button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}

        <button onClick={leave} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wine-700/10 py-3 font-semibold text-wine-600">
          <LogOut className="h-4 w-4" /> Log out / switch room
        </button>
      </div>
    </BottomSheet>
  );
}
