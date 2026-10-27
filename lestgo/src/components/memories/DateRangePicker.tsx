"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, fmtRange, monthRange, todayStr, yearRange, type DateRange } from "@/lib/dates";
import BottomSheet from "../BottomSheet";

type Tab = "tanggal" | "bulan" | "tahun";
const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function DateRangePicker({ value, onApply, onClose }: {
  value: DateRange; onApply: (r: DateRange) => void; onClose: () => void;
}) {
  const now = new Date();
  const [tab, setTab] = useState<Tab>("tanggal");
  const [draft, setDraft] = useState<DateRange>(value);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [year, setYear] = useState(now.getFullYear());

  const today = todayStr();
  const pickDay = (d: string) => {
    if (!draft.from || draft.to) setDraft({ from: d, to: null });
    else if (d < draft.from) setDraft({ from: d, to: draft.from });
    else setDraft({ from: draft.from, to: d });
  };

  const { y, m } = cursor;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const move = (delta: number) => { const d = new Date(y, m + delta, 1); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };

  const apply = () => onApply(draft.from ? { from: draft.from, to: draft.to ?? draft.from } : { from: null, to: null });
  const years = Array.from({ length: 10 }, (_, k) => now.getFullYear() - k);
  const same = (r: DateRange) => draft.from === r.from && draft.to === r.to;

  const tabBtn = (t: Tab, label: string) => (
    <button key={t} onClick={() => setTab(t)}
      className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${tab === t ? "bg-brand text-white shadow" : "text-zinc-500"}`}>{label}</button>
  );

  return (
    <BottomSheet title="Filter tanggal" onClose={onClose}>
      <div className="space-y-4">
        <div className="glass flex rounded-full p-1">{tabBtn("tanggal", "Tanggal")}{tabBtn("bulan", "Bulan")}{tabBtn("tahun", "Tahun")}</div>

        {tab === "tanggal" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => move(-1)} aria-label="Bulan sebelumnya" className="rounded-full bg-white/70 p-2"><ChevronLeft className="h-4 w-4" /></button>
              <p className="font-bold">{MONTHS[m]} {y}</p>
              <button onClick={() => move(1)} aria-label="Bulan berikutnya" className="rounded-full bg-white/70 p-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-zinc-400">{DAYS.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: offset }).map((_, i) => <span key={"e" + i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const ds = `${y}-${pad(m + 1)}-${pad(i + 1)}`;
                const end = draft.to ?? draft.from;
                const edge = ds === draft.from || ds === end;
                const mid = !!draft.from && !!end && ds > draft.from && ds < end;
                return (
                  <button key={ds} onClick={() => pickDay(ds)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${edge ? "bg-brand text-white shadow" : mid ? "bg-wine-700/15 text-wine-700" : ds === today ? "text-wine-700 ring-1 ring-wine-700/40" : "text-zinc-700"}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-zinc-400">Ketuk satu tanggal, atau dua tanggal untuk rentang.</p>
          </div>
        )}

        {tab === "bulan" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => setYear(year - 1)} aria-label="Tahun sebelumnya" className="rounded-full bg-white/70 p-2"><ChevronLeft className="h-4 w-4" /></button>
              <p className="font-bold">{year}</p>
              <button onClick={() => setYear(year + 1)} aria-label="Tahun berikutnya" className="rounded-full bg-white/70 p-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((name, idx) => (
                <button key={name} onClick={() => setDraft(monthRange(year, idx))}
                  className={`rounded-2xl py-3 text-sm font-semibold transition ${same(monthRange(year, idx)) ? "bg-brand text-white shadow" : "bg-white/70 text-zinc-600 ring-1 ring-white/60"}`}>{name}</button>
              ))}
            </div>
          </div>
        )}

        {tab === "tahun" && (
          <div className="grid grid-cols-3 gap-2">
            {years.map((yy) => (
              <button key={yy} onClick={() => setDraft(yearRange(yy))}
                className={`rounded-2xl py-3 text-sm font-semibold transition ${same(yearRange(yy)) ? "bg-brand text-white shadow" : "bg-white/70 text-zinc-600 ring-1 ring-white/60"}`}>{yy}</button>
            ))}
          </div>
        )}

        {draft.from && <p className="rounded-2xl bg-wine-700/10 px-4 py-2.5 text-center text-sm font-medium text-wine-700">{fmtRange(draft)}</p>}

        <div className="flex gap-3">
          <button onClick={() => onApply({ from: null, to: null })} className="flex-1 rounded-2xl bg-white/70 py-3 font-semibold text-zinc-600 ring-1 ring-white/60">Reset</button>
          <button onClick={apply} className="flex-1 rounded-2xl bg-brand py-3 font-semibold text-white shadow-lg shadow-wine-700/25">Terapkan</button>
        </div>
      </div>
    </BottomSheet>
  );
}
