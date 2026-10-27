"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import BottomSheet from "../BottomSheet";

const OUT_W = 1080;
const OUT_H = 1350; // rasio 4:5 (seperti feed Instagram)

const clamp = (v: number, m: number) => Math.min(m, Math.max(-m, v));

export default function PhotoCropper({ file, onDone, onCancel }: {
  file: File; onDone: (f: File) => void; onCancel: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [w, setW] = useState(300);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const offRef = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const h = w * 1.25;

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
  }, [url]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (!img) return null;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const swap = rot % 180 !== 0;
    const rw = swap ? ih : iw, rh = swap ? iw : ih;
    const scale = Math.max(w / rw, h / rh) * zoom;
    return {
      iw, ih, scale,
      maxX: Math.max(0, (rw * scale - w) / 2),
      maxY: Math.max(0, (rh * scale - h) / 2),
    };
  }, [img, rot, zoom, w, h]);

  // Saat zoom/rotasi berubah, pastikan posisi tetap di dalam batas
  useEffect(() => {
    if (!geo) return;
    const c = { x: clamp(offRef.current.x, geo.maxX), y: clamp(offRef.current.y, geo.maxY) };
    offRef.current = c;
    setOff(c);
  }, [geo]);

  const ox = geo ? clamp(off.x, geo.maxX) : 0;
  const oy = geo ? clamp(off.y, geo.maxY) : 0;

  const rotate = (dir: 1 | -1) => {
    offRef.current = { x: 0, y: 0 };
    setOff({ x: 0, y: 0 });
    setRot((r) => (r + 90 * dir + 360) % 360);
  };

  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !geo) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) setZoom((z) => Math.min(4, Math.max(1, (z * d) / pinch.current!)));
      pinch.current = d;
      return;
    }
    const next = {
      x: clamp(offRef.current.x + e.clientX - prev.x, geo.maxX),
      y: clamp(offRef.current.y + e.clientY - prev.y, geo.maxY),
    };
    offRef.current = next;
    setOff(next);
  };

  const release = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  };

  const save = () => {
    if (!img || !geo) return;
    setBusy(true);
    const c = document.createElement("canvas");
    c.width = OUT_W; c.height = OUT_H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, OUT_W, OUT_H);
    const k = OUT_W / w;
    ctx.translate(OUT_W / 2 + ox * k, OUT_H / 2 + oy * k);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(geo.scale * k, geo.scale * k);
    ctx.drawImage(img, -geo.iw / 2, -geo.ih / 2);
    c.toBlob((b) => {
      if (!b) { setBusy(false); return; }
      onDone(new File([b], `foto-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.88);
  };

  const round = "flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-wine-700 shadow-sm ring-1 ring-white/60 backdrop-blur";

  return (
    <BottomSheet title="Atur foto (4:5)" onClose={onCancel}>
      <div className="space-y-4">
        <div
          ref={boxRef}
          className="relative mx-auto aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-2xl bg-zinc-900"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            pinch.current = null;
          }}
          onPointerMove={onMove}
          onPointerUp={release}
          onPointerCancel={release}
          onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)))}
        >
          {geo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url} alt="" draggable={false}
              style={{
                position: "absolute", left: "50%", top: "50%", maxWidth: "none", pointerEvents: "none",
                width: geo.iw * geo.scale, height: geo.ih * geo.scale,
                transform: `translate(-50%, -50%) translate(${ox}px, ${oy}px) rotate(${rot}deg)`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/70" /></div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40" />
        </div>
        <p className="text-center text-xs text-zinc-400">Geser untuk memindahkan, cubit atau pakai slider untuk zoom.</p>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.25))} aria-label="Zoom out" className={round}><ZoomOut className="h-5 w-5" /></button>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
            aria-label="Zoom" className="h-1.5 flex-1 accent-[#800020]" />
          <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} aria-label="Zoom in" className={round}><ZoomIn className="h-5 w-5" /></button>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => rotate(-1)} aria-label="Putar kiri" className={round}><RotateCcw className="h-5 w-5" /></button>
          <button type="button" onClick={() => rotate(1)} aria-label="Putar kanan" className={round}><RotateCw className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-zinc-100 py-3 font-semibold text-zinc-600">Batal</button>
          <button type="button" disabled={!geo || busy} onClick={save}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3 font-semibold text-white transition active:scale-[0.98] disabled:opacity-40">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pakai foto
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
