"use client";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { MONTHS } from "@/lib/dates";
import { useData } from "../DataProvider";

export default function StatsCard() {
  const { places } = useData();
  const [cat, setCat] = useState("All");

  const { wish, done } = useMemo(() => {
    const f = places.filter((p) => cat === "All" || p.category === cat);
    return { wish: f.filter((p) => p.status === "wishlist").length, done: f.filter((p) => p.status === "visited").length };
  }, [places, cat]);

  const months = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) if (p.status === "visited" && p.visited_date) {
      const k = p.visited_date.slice(0, 7);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  }, [places]);

  const maxMonth = Math.max(1, ...months.map(([, n]) => n));
  const total = wish + done;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Statistik kencan</h2>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${cat === c ? "bg-violet-600 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-100"}`}>{c}</button>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-violet-50 py-3"><p className="text-3xl font-extrabold text-violet-600">{wish}</p><p className="text-xs text-zinc-500">Wishlist</p></div>
          <div className="rounded-2xl bg-emerald-50 py-3"><p className="text-3xl font-extrabold text-emerald-600">{done}</p><p className="text-xs text-zinc-500">Sudah dikunjungi</p></div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
        </div>
        <p className="mt-1.5 text-xs text-zinc-400">{total ? `${Math.round((done / total) * 100)}% wishlist sudah terwujud` : "Belum ada data"}</p>
      </div>

      <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <p className="mb-3 text-sm font-semibold">Ringkasan bulanan</p>
        {months.length === 0 ? (
          <p className="text-sm text-zinc-400">Belum ada kencan yang tercatat.</p>
        ) : (
          <ul className="space-y-2.5">
            {months.map(([k, n]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{MONTHS[parseInt(k.slice(5), 10) - 1]} {k.slice(0, 4)}</span>
                  <span className="font-semibold">{n} kali kencan</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(n / maxMonth) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
