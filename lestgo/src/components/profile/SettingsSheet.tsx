"use client";
import { useRef, useState } from "react";
import { Camera, Check, Copy, Loader2, LogOut, Pencil, Plus, X } from "lucide-react";
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
    catch (e) { return e instanceof Error ? e.message : "Gagal mengganti foto."; }
  });

  const exists = (name: string, except?: string) =>
    categories.some((c) => c.toLowerCase() === name.toLowerCase() && c !== except);

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (exists(name)) { setError("Kategori itu sudah ada."); return; }
    run(async () => {
      const msg = await saveSettings({ categories: [...categories, name] });
      if (!msg) setNewCat("");
      return msg;
    });
  };

  const renameCategory = (old: string) => {
    const name = editText.trim();
    if (!name || name === old) { setEditing(null); return; }
    if (exists(name, old)) { setError("Kategori itu sudah ada."); return; }
    run(async () => {
      // semua tempat dan folder yang memakai nama lama ikut diganti
      const p = await supabase.from("places").update({ category: name }).eq("room_id", roomId).eq("category", old);
      if (p.error) return p.error.message;
      const f = await supabase.from("list_folders").update({ category: name }).eq("room_id", roomId).eq("category", old);
      if (f.error) return f.error.message;
      const msg = await saveSettings({ categories: categories.map((c) => (c === old ? name : c)) });
      if (!msg) { setEditing(null); refetch(); }
      return msg;
    });
  };

  const leave = () => {
    if (window.confirm("Keluar dari room ini? Kamu perlu kode room lagi untuk masuk kembali. Data tidak terhapus.")) { onClose(); unpair(); }
  };

  return (
    <BottomSheet title="Pengaturan" onClose={onClose} tall>
      <div className="space-y-4">
        <div className={card}>
          <p className={head}>ID Room pasangan</p>
          <button onClick={copy} className="flex w-full items-center justify-between rounded-2xl bg-wine-700/10 px-4 py-3">
            <span className="font-mono text-xl font-bold tracking-widest text-wine-700">{room?.code}</span>
            {copied ? <Check className="h-5 w-5 text-wine-700" /> : <Copy className="h-5 w-5 text-wine-700/60" />}
          </button>
        </div>

        <div className={card}>
          <p className={head}>Foto profil pasangan</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) changePhoto(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex w-full items-center gap-3 text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand">
              {roomInfo.couple_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={roomInfo.couple_photo_url} alt="" className="h-full w-full object-cover" />
              ) : <Camera className="h-5 w-5 text-white" />}
            </span>
            <span className="flex-1 text-sm font-semibold">Ganti foto</span>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-wine-700" />}
          </button>
        </div>

        <div className={card}>
          <p className={head}>Tanggal jadian</p>
          <input type="date" max={todayStr()} value={roomInfo.anniversary_date ?? ""}
            onChange={(e) => { if (e.target.value) run(() => saveSettings({ anniversary_date: e.target.value })); }}
            className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 outline-none focus:border-wine-600" />
        </div>

        <div className={card}>
          <p className={head}>Kategori</p>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-white/60">
                {editing === c ? (
                  <>
                    <input value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={30} autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") renameCategory(c); }}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    <button onClick={() => renameCategory(c)} aria-label="Simpan" className="rounded-full bg-brand p-1.5 text-white"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditing(null)} aria-label="Batal" className="p-1.5 text-zinc-400"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{c}</span>
                    <button onClick={() => { setEditing(c); setEditText(c); setError(null); }} aria-label={`Ubah ${c}`} className="p-1.5 text-zinc-400"><Pencil className="h-4 w-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={30} placeholder="Kategori baru"
              onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
            <button onClick={addCategory} disabled={busy || !newCat.trim()} aria-label="Tambah kategori"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white disabled:opacity-40"><Plus className="h-5 w-5" /></button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Mengubah nama kategori ikut mengubah semua tempat dan folder yang memakainya.</p>
        </div>

        <div className={card}>
          <p className={head}>Di perangkat ini kamu adalah</p>
          <div className="flex rounded-full bg-white/60 p-1">
            {(["kiky", "safina"] as PersonKey[]).map((k) => (
              <button key={k} onClick={() => setMe(k)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${me === k ? "bg-brand text-white shadow" : "text-zinc-500"}`}>{ME_LABEL[k]}</button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}

        <button onClick={leave} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wine-700/10 py-3 font-semibold text-wine-600">
          <LogOut className="h-4 w-4" /> Log out / ganti room
        </button>
      </div>
    </BottomSheet>
  );
}
