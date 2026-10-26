"use client";
import { Heart, History } from "lucide-react";
import { fmtShort } from "@/lib/dates";
import type { Memory } from "@/lib/types";

export default function OnThisDay({ memories, anniversary, onOpen }: {
  memories: Memory[]; anniversary: string | null; onOpen: (m: Memory) => void;
}) {
  const now = new Date();
  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // 1) Hari anniversary
  if (anniversary && anniversary.slice(5) === md) {
    const years = now.getFullYear() - parseInt(anniversary.slice(0, 4), 10);
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 p-5 text-white shadow-lg shadow-rose-200">
        <Heart className="absolute -right-4 -top-4 h-28 w-28 fill-white/15 text-white/15" />
        <p className="text-xs font-semibold text-white/80">Hari ini</p>
        <h3 className="mt-1 text-xl font-bold">{years > 0 ? `Selamat anniversary ke-${years}!` : "Selamat anniversary!"}</h3>
        <p className="mt-1 text-sm text-white/85">Rayakan dengan makan malam atau jalan-jalan berdua.</p>
      </div>
    );
  }

  // 2) Kenangan di tanggal yang sama pada tahun lalu
  const sameDay = memories.find((m) => m.visit_date.slice(5) === md && parseInt(m.visit_date.slice(0, 4), 10) < now.getFullYear());
  // 3) Flashback: kenangan lama yang berganti tiap hari
  const old = memories.filter((m) => +now - +new Date(m.visit_date + "T00:00:00") > 30 * 86400000);
  const dayOfYear = Math.floor((+now - +new Date(now.getFullYear(), 0, 0)) / 86400000);
  const pick = sameDay ?? (old.length ? old[dayOfYear % old.length] : null);
  if (!pick) return null;

  const years = now.getFullYear() - parseInt(pick.visit_date.slice(0, 4), 10);
  const label = sameDay ? (years === 1 ? "Setahun lalu hari ini" : `${years} tahun lalu hari ini`) : "Flashback";

  return (
    <button onClick={() => onOpen(pick)} className="relative block h-44 w-full overflow-hidden rounded-3xl bg-violet-100 text-left shadow-lg shadow-violet-200 transition active:scale-[0.98]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pick.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700"><History className="h-3 w-3" /> {label}</span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-1 text-lg font-bold">{pick.place_name}</h3>
        <p className="text-xs text-white/80">{fmtShort(pick.visit_date)}</p>
      </div>
    </button>
  );
}
