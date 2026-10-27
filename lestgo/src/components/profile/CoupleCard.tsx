"use client";
import { Heart } from "lucide-react";
import { togetherSince } from "@/lib/dates";
import { useData } from "../DataProvider";

export default function CoupleCard() {
  const { roomInfo } = useData();
  const t = roomInfo.anniversary_date ? togetherSince(roomInfo.anniversary_date) : null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand p-5 text-white shadow-lg shadow-wine-700/30">
      <Heart className="absolute -right-6 -top-6 h-36 w-36 fill-white/10 text-white/10" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/60 bg-white/20">
          {roomInfo.couple_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={roomInfo.couple_photo_url} alt="Foto pasangan" className="h-full w-full object-cover" />
          ) : <Heart className="h-8 w-8 fill-white text-white" />}
        </div>
        <div className="min-w-0">
          {t ? (
            <>
              <p className="text-3xl font-extrabold leading-tight">{t.totalDays.toLocaleString("id-ID")} <span className="text-lg font-bold">hari</span></p>
              <p className="text-xs text-white/85">
                {[t.years && `${t.years} tahun`, t.months && `${t.months} bulan`, `${t.days} hari`].filter(Boolean).join(" ")} bersama
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold">Atur tanggal jadian di Pengaturan (ikon gerigi di bawah) untuk mulai menghitung.</p>
          )}
        </div>
      </div>
    </section>
  );
}
