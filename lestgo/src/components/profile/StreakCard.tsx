"use client";
import { useMemo } from "react";
import { placeVisitDates } from "@/lib/places";
import { todayStr } from "@/lib/dates";
import { useData } from "../DataProvider";
import FlamingHeart from "./FlamingHeart";

export default function StreakCard() {
  const { places } = useData();

  // Otomatis kembali ke 0 setiap awal bulan karena hanya menghitung bulan berjalan
  const count = useMemo(() => {
    const month = todayStr().slice(0, 7);
    return places.flatMap(placeVisitDates).filter((d) => d.startsWith(month)).length;
  }, [places]);

  const level: 1 | 2 | 3 = count >= 10 ? 3 : count >= 5 ? 2 : 1;
  const desc =
    level === 3 ? "Membara! Bulan ini kalian on fire."
    : level === 2 ? `Apinya mulai menyala. ${10 - count} kencan lagi menuju bara penuh.`
    : count === 0 ? "Belum ada kencan bulan ini. Yuk nyalakan apinya!"
    : `${5 - count} kencan lagi biar apinya menyala.`;

  return (
    <section className="glass flex items-center gap-4 rounded-3xl p-4">
      <FlamingHeart level={level} />
      <div className="min-w-0">
        <p className={`text-5xl font-extrabold leading-none ${level === 1 ? "text-zinc-400" : "bg-brand-bright bg-clip-text text-transparent"}`}>{count}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-700">kali kencan bulan ini</p>
        <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      </div>
    </section>
  );
}
