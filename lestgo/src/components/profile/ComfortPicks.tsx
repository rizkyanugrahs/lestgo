"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Dices, Star } from "lucide-react";
import { fmtShort } from "@/lib/dates";
import { styleFor } from "@/lib/categories";
import type { PersonKey, Place } from "@/lib/types";
import { useData } from "../DataProvider";
import { ME_LABEL } from "../MeProvider";
import BottomSheet from "../BottomSheet";
import VisitBadge from "../VisitBadge";
import GachaSheet from "./GachaSheet";

function PickRow({ p, onOpen }: { p: Place; onOpen: (p: Place) => void }) {
  const { Icon, bg, text } = styleFor(p.category);
  return (
    <button onClick={() => onOpen(p)} className="glass flex w-full items-center gap-3 rounded-3xl p-3 text-left transition active:scale-[0.98]">
      <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl ${bg}`}>
        {p.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />
        ) : <div className="flex h-full w-full items-center justify-center"><Icon className={`h-6 w-6 ${text}`} /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-semibold">{p.title}</h3>
        <p className="text-xs text-zinc-400">{p.category}{p.visited_date ? ` · ${fmtShort(p.visited_date)}` : ""}</p>
        <VisitBadge count={p.visit_count} className="mt-1" />
      </div>
      {p.rating && <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating}</span>}
    </button>
  );
}

export default function ComfortPicks({ onOpen }: { onOpen: (p: Place) => void }) {
  const { places } = useData();
  const [tab, setTab] = useState<PersonKey>("kiky");
  const [all, setAll] = useState(false);
  const [gacha, setGacha] = useState(false);

  // Urutan favorit: rating tertinggi, lalu paling sering dikunjungi, lalu terbaru
  const picks = useMemo(() => places
    .filter((p) => p.is_comfort_pick && p.comfort_pick_by === tab)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.visit_count - a.visit_count || (b.visited_date ?? "").localeCompare(a.visited_date ?? "")),
  [places, tab]);

  return (
    <section className="space-y-3">
      <div className="glass flex rounded-full p-1">
        {(["kiky", "safina"] as PersonKey[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${tab === k ? "bg-brand text-white shadow" : "text-zinc-500"}`}>
            {ME_LABEL[k]}&apos;s Picks
          </button>
        ))}
      </div>

      {picks.length === 0 ? (
        <div className="glass rounded-3xl p-6 text-center text-sm text-zinc-500">
          Belum ada pick dari {ME_LABEL[tab]}. Aktifkan tombol Comfort Pick saat mencatat tempat.
        </div>
      ) : (
        <div className="space-y-3">
          {picks.slice(0, 3).map((p) => <PickRow key={p.id} p={p} onOpen={onOpen} />)}
          {picks.length > 3 && (
            <button onClick={() => setAll(true)} className="w-full rounded-2xl bg-wine-700/10 py-2.5 text-sm font-semibold text-wine-700">
              Lihat semua ({picks.length})
            </button>
          )}
        </div>
      )}

      <button onClick={() => setGacha(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98]">
        <Dices className="h-5 w-5" /> Bingung mau kemana / makan apa?
      </button>

      <AnimatePresence>
        {all && (
          <BottomSheet title={`${ME_LABEL[tab]}'s Picks`} onClose={() => setAll(false)}>
            <div className="space-y-3">{picks.map((p) => <PickRow key={p.id} p={p} onOpen={(x) => { setAll(false); onOpen(x); }} />)}</div>
          </BottomSheet>
        )}
        {gacha && <GachaSheet onClose={() => setGacha(false)} onOpen={(p) => { setGacha(false); onOpen(p); }} />}
      </AnimatePresence>
    </section>
  );
}
