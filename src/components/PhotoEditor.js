"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { MIN_ZOOM, MAX_ZOOM, baseScale, centerOffset, clampOffset, clampZoom, zoomAround, cropRect, outputSize } from "@/lib/crop";

const ASPECTS = [["orig", "photo_aspect_orig"], [1, "1:1"], [4 / 5, "4:5"], [16 / 9, "16:9"]];

// Edit foto dasar: geser, zoom in/out, dan potong (crop) sebelum disimpan.
// circle = true dipakai untuk foto profil (bingkai bulat, rasio 1:1).
export default function PhotoEditor({ file, circle = false, maxSide = 1280, queueLabel, onConfirm, onUseOriginal, onCancel }) {
  const { t } = useI18n();
  const [img, setImg] = useState(null);
  const [url, setUrl] = useState("");
  const [aspect, setAspect] = useState(circle ? 1 : "orig");
  const [box, setBox] = useState({ w: 300, h: 300 });
  const [view, setView] = useState({ zoom: 1, ox: 0, oy: 0 });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pointers = useRef(new Map());
  const lastDist = useRef(0);

  // muat foto
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    setImg(null);
    setFailed(false);
    const im = new Image();
    im.onload = () => setImg(im);
    im.onerror = () => setFailed(true);
    im.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // hitung ukuran bingkai dan posisi awal saat foto atau rasio berubah
  useEffect(() => {
    if (!img) return;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const a = aspect === "orig" ? iw / ih : aspect;
    const maxW = Math.min(340, window.innerWidth - 72);
    const maxH = Math.max(180, window.innerHeight * 0.45);
    const w = Math.max(120, Math.min(maxW, maxH * a));
    const h = w / a;
    setBox({ w, h });
    const s = baseScale(iw, ih, w, h);
    const o = centerOffset(iw, ih, s, w, h);
    setView({ zoom: 1, ox: o.ox, oy: o.oy });
  }, [img, aspect]);

  if (!file) return null;

  const iw = img ? img.naturalWidth : 1;
  const ih = img ? img.naturalHeight : 1;
  const s = img ? baseScale(iw, ih, box.w, box.h) * view.zoom : 1;

  function pan(dx, dy) {
    setView((v) => {
      const sc = baseScale(iw, ih, box.w, box.h) * v.zoom;
      const o = clampOffset(v.ox + dx, v.oy + dy, iw, ih, sc, box.w, box.h);
      return { ...v, ox: o.ox, oy: o.oy };
    });
  }
  function zoomTo(z, cx = box.w / 2, cy = box.h / 2) {
    setView((v) => zoomAround(v, z, cx, cy, iw, ih, box.w, box.h));
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      lastDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  function onPointerMove(e) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 1) {
      pan(cur.x - prev.x, cur.y - prev.y);
    } else if (pointers.current.size === 2) {
      pointers.current.set(e.pointerId, cur);
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastDist.current > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = (a.x + b.x) / 2 - rect.left;
        const cy = (a.y + b.y) / 2 - rect.top;
        setView((v) => zoomAround(v, v.zoom * (dist / lastDist.current), cx, cy, iw, ih, box.w, box.h));
      }
      lastDist.current = dist;
      return;
    }
    pointers.current.set(e.pointerId, cur);
  }
  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    lastDist.current = 0;
  }
  function onWheel(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    zoomTo(view.zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - rect.left, e.clientY - rect.top);
  }

  function confirm() {
    if (!img) return;
    setBusy(true);
    const r = cropRect(view, iw, ih, box.w, box.h);
    const { w, h } = outputSize(r.sw, r.sh, circle ? 640 : maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    canvas.toBlob((blob) => {
      setBusy(false);
      if (blob) onConfirm(blob);
    }, "image/jpeg", 0.88);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/90 p-4">
      <div className="my-auto w-full max-w-sm space-y-4 rounded-3xl border border-white/10 bg-neutral-950 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("photo_edit_title")}</h2>
          {queueLabel ? <span className="text-xs text-zinc-400">{queueLabel}</span> : null}
        </div>

        {failed ? (
          <p className="py-8 text-center text-sm text-red-300">{t("photo_error")}</p>
        ) : !img ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-400" /></div>
        ) : (
          <>
            <div className="flex justify-center">
              <div
                className="relative select-none overflow-hidden rounded-xl border border-white/20 bg-black"
                style={{ width: box.w, height: box.h, touchAction: "none", cursor: "grab" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" draggable={false} style={{ position: "absolute", left: 0, top: 0, width: iw * s, height: ih * s, maxWidth: "none", transform: "translate(" + view.ox + "px," + view.oy + "px)", pointerEvents: "none" }} />
                {circle && <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)" }} />}
              </div>
            </div>
            <p className="text-center text-[11px] text-zinc-500">{t("photo_hint")}</p>

            {!circle && (
              <div className="flex flex-wrap justify-center gap-2">
                {ASPECTS.map(([k, label]) => (
                  <button key={String(k)} type="button" onClick={() => setAspect(k)} className={"rounded-full border px-3 py-1.5 text-xs " + (aspect === k ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label.startsWith("photo_") ? t(label) : label}</button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => zoomTo(view.zoom - 0.25)} aria-label={t("photo_zoom_out")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10"><Minus size={16} /></button>
              <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={view.zoom} onChange={(e) => zoomTo(clampZoom(Number(e.target.value)))} aria-label={t("photo_zoom")} className="min-w-0 flex-1" />
              <button type="button" onClick={() => zoomTo(view.zoom + 0.25)} aria-label={t("photo_zoom_in")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10"><Plus size={16} /></button>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300">{t("cancel")}</button>
          {onUseOriginal && <button type="button" onClick={onUseOriginal} disabled={busy} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-200">{t("photo_use_original")}</button>}
          <button type="button" onClick={confirm} disabled={busy || !img} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-sm font-medium text-black disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />}{t("save")}</button>
        </div>
      </div>
    </div>
  );
}
