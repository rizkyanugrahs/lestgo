"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { MONTHS } from "@/lib/dates";
import { placeVisitDates } from "@/lib/places";
import { STORY_H, STORY_W, drawMonthlyDump, saveImage, type DumpItem } from "@/lib/dump";
import BottomSheet from "../BottomSheet";
import { useData } from "../DataProvider";

/** Loads a photo so it can be drawn on the canvas. Returns null if it can't be loaded. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // a separate address avoids a browser cache that was stored without permission for canvas use
    img.src = url + (url.includes("?") ? "&" : "?") + "dump=1";
  });
}

export default function MonthlyDumpSheet({ onClose }: { onClose: () => void }) {
  const { places } = useData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cache = useRef(new Map<string, Promise<HTMLImageElement | null>>());
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // months that have at least one visit, newest first
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) for (const d of placeVisitDates(p)) set.add(d.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [places]);

  const [month, setMonth] = useState<string | null>(null);
  const active = month ?? months[0] ?? null;

  // entries visited in the chosen month (photos first, best rated first), shown in date order
  const { items, dates } = useMemo(() => {
    if (!active) return { items: [] as DumpItem[], dates: 0 };
    let count = 0;
    const entries: { title: string; photo: string | null; rating: number; date: string }[] = [];
    for (const p of places) {
      const inMonth = placeVisitDates(p).filter((d) => d.startsWith(active));
      if (inMonth.length === 0) continue;
      count += inMonth.length;
      entries.push({ title: p.title, photo: p.photos[0] ?? null, rating: p.rating ?? 0, date: inMonth.sort()[0] });
    }
    const picked = entries
      .sort((a, b) => Number(!!b.photo) - Number(!!a.photo) || b.rating - a.rating || b.date.localeCompare(a.date))
      .slice(0, 9)
      .sort((a, b) => a.date.localeCompare(b.date));
    return { items: picked.map(({ title, photo }) => ({ title, photo })), dates: count };
  }, [places, active]);

  const monthName = active ? MONTHS[parseInt(active.slice(5), 10) - 1] : "";
  const year = active ? parseInt(active.slice(0, 4), 10) : new Date().getFullYear();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    let cancelled = false;
    setRendering(true); setError(null);
    const load = (url: string) => {
      let p = cache.current.get(url);
      if (!p) { p = loadImage(url); cache.current.set(url, p); }
      return p;
    };
    drawMonthlyDump(canvas, { month: monthName, year, dates, items }, load)
      .catch(() => { if (!cancelled) setError("Couldn't build the preview. Please try again."); })
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [active, monthName, year, dates, items]);

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    setSaving(true); setError(null);
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("no image");
      await saveImage(blob, `lestgo-${monthName.toLowerCase()}-${year}-dump.png`);
    } catch {
      setError("Couldn't save the image. Please try again.");
    }
    setSaving(false);
  };

  return (
    <BottomSheet title="Monthly Dump" onClose={onClose} tall>
      {months.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-sm text-zinc-500">
          No dates logged yet. Log a visit with the <b>+</b> button and it will show up here.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {months.map((m) => (
              <button key={m} onClick={() => setMonth(m)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  m === active ? "border-transparent bg-brand text-white shadow-md shadow-wine-700/25" : "border-white/60 bg-white/70 text-zinc-600"}`}>
                {MONTHS[parseInt(m.slice(5), 10) - 1].slice(0, 3)} {m.slice(0, 4)}
              </button>
            ))}
          </div>

          <div className="relative mx-auto overflow-hidden rounded-2xl bg-wine-900 shadow-lg"
            style={{ height: "56dvh", width: "calc(56dvh * 9 / 16)", maxWidth: "100%" }}>
            <canvas ref={canvasRef} width={STORY_W} height={STORY_H} className="h-full w-full object-contain" />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Loader2 className="h-7 w-7 animate-spin text-white" /></div>
            )}
          </div>
          <p className="text-center text-xs text-zinc-400">Story size 1080 × 1920. Photos and place names come from this month&apos;s dates.</p>

          {error && <p className="rounded-2xl bg-wine-700/10 px-4 py-3 text-sm text-wine-600">{error}</p>}

          <button onClick={download} disabled={rendering || saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg shadow-wine-700/25 transition active:scale-[0.98] disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download Story
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
