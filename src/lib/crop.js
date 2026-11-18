// Hitungan untuk edit foto (crop + zoom). Dibuat terpisah agar mudah diuji.
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export function baseScale(iw, ih, vw, vh) {
  return Math.max(vw / iw, vh / ih);
}

export function clampZoom(z) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

// Menjaga foto selalu menutupi seluruh bingkai
export function clampOffset(ox, oy, iw, ih, s, vw, vh) {
  const minX = vw - iw * s;
  const minY = vh - ih * s;
  return {
    ox: Math.min(0, Math.max(minX, ox)),
    oy: Math.min(0, Math.max(minY, oy)),
  };
}

export function centerOffset(iw, ih, s, vw, vh) {
  return clampOffset((vw - iw * s) / 2, (vh - ih * s) / 2, iw, ih, s, vw, vh);
}

// Zoom dengan titik (cx, cy) di bingkai tetap diam
export function zoomAround(view, newZoom, cx, cy, iw, ih, vw, vh) {
  const base = baseScale(iw, ih, vw, vh);
  const z = clampZoom(newZoom);
  const sOld = base * view.zoom;
  const sNew = base * z;
  const px = (cx - view.ox) / sOld;
  const py = (cy - view.oy) / sOld;
  const off = clampOffset(cx - px * sNew, cy - py * sNew, iw, ih, sNew, vw, vh);
  return { zoom: z, ox: off.ox, oy: off.oy };
}

// Area foto asli yang terlihat di bingkai
export function cropRect(view, iw, ih, vw, vh) {
  const s = baseScale(iw, ih, vw, vh) * view.zoom;
  return { sx: -view.ox / s, sy: -view.oy / s, sw: vw / s, sh: vh / s };
}

export function outputSize(sw, sh, maxSide) {
  const f = Math.min(1, maxSide / Math.max(sw, sh));
  return { w: Math.max(1, Math.round(sw * f)), h: Math.max(1, Math.round(sh * f)) };
}
