"use client";
import { useRef, useState } from "react";
import { Camera, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/storage";
import { placeError } from "@/lib/places";
import { togetherSince, todayStr } from "@/lib/dates";
import { useData } from "../DataProvider";
import { useRoomId } from "../RoomProvider";

export default function CoupleCard() {
  const roomId = useRoomId();
  const { roomInfo, refetchRoom } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = roomInfo.anniversary_date ? togetherSince(roomInfo.anniversary_date) : null;

  const changePhoto = async (file: File) => {
    setBusy(true); setError(null);
    try {
      const url = await uploadPhoto(file, roomId);
      const { error } = await supabase.from("rooms").update({ couple_photo_url: url }).eq("id", roomId);
      if (error) throw new Error(error.message);
      refetchRoom();
    } catch (e) { setError(placeError(e instanceof Error ? e.message : "Gagal mengganti foto.")); }
    setBusy(false);
  };

  const saveDate = async (v: string) => {
    if (!v) return;
    const { error } = await supabase.from("rooms").update({ anniversary_date: v }).eq("id", roomId);
    if (error) setError(placeError(error.message)); else { refetchRoom(); setEditing(false); }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 p-5 text-white shadow-lg shadow-rose-200">
      <Heart className="absolute -right-6 -top-6 h-36 w-36 fill-white/10 text-white/10" />
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/70 bg-white/20">
            {roomInfo.couple_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={roomInfo.couple_photo_url} alt="Foto pasangan" className="h-full w-full object-cover" />
            ) : <Heart className="h-8 w-8 fill-white text-white" />}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) changePhoto(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} aria-label="Ganti foto pasangan"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white/80">Kiky &amp; Safina</p>
          {t ? (
            <>
              <p className="text-3xl font-extrabold leading-tight">{t.totalDays.toLocaleString("id-ID")} <span className="text-lg font-bold">hari</span></p>
              <p className="text-xs text-white/85">
                {[t.years && `${t.years} tahun`, t.months && `${t.months} bulan`, `${t.days} hari`].filter(Boolean).join(" ")} bersama
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold">Atur tanggal jadian untuk mulai menghitung</p>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        {editing || !t ? (
          <input type="date" max={todayStr()} defaultValue={roomInfo.anniversary_date ?? ""} onChange={(e) => saveDate(e.target.value)}
            aria-label="Tanggal jadian" className="rounded-xl bg-white px-3 py-2 text-sm text-zinc-800 outline-none" />
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-white/85 underline underline-offset-2">Ubah tanggal jadian</button>
        )}
      </div>
      {error && <p className="relative mt-2 text-xs text-white">{error}</p>}
    </section>
  );
}
