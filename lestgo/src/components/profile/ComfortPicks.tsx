"use client";
import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { fmtShort } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import type { PersonKey, Place } from "@/lib/types";
import { useData } from "../DataProvider";
import { ME_LABEL } from "../MeProvider";

export default function ComfortPicks({ onOpen }: { onOpen: (p: Place) => void }) {
  const { places } = useData();
  const [tab, setTab] = useState<PersonKey>("kiky");
  const picks = places.filter((p) => p.is_comfort_pick && p.comfort_pick_by === tab);

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Heart className="h-5 w-5 fill-rose-500 text-rose-500" /> Comfort Picks</h2>
      <div className="mb-3 flex rounded-2xl bg-zinc-100 p-1">
        {(["kiky", "safina"] as PersonKey[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${tab === k ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500"}`}>
            {ME_LABEL[k]}&apos;s Picks
          </button>
        ))}
      </div>

      {picks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
          Belum ada pick dari {ME_LABEL[tab]}. Aktifkan tombol Comfort Pick saat mencatat tempat.
        </div>
      ) : (
        <ul className="space-y-3">
          {picks.map((p) => {
            const { Icon, bg, text } = styleFor(p.category);
            return (
              <li key={p.id}>
                <button onClick={() => onOpen(p)} className="flex w-full items-center gap-3 rounded-3xl bg-white p-3 text-left shadow-sm ring-1 ring-zinc-100 transition active:scale-[0.98]">
                  <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl ${bg}`}>
                    {p.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : <div className="flex h-full w-full items-center justify-center"><Icon className={`h-6 w-6 ${text}`} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
                    <p className="text-xs text-zinc-400">{p.category}{p.visited_date ? ` · ${fmtShort(p.visited_date)}` : ""}</p>
                  </div>
                  {p.rating && <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
