/** Draws the "Monthly Dump" story (1080 x 1920) on a canvas. No extra packages needed. */

export const STORY_W = 1080;
export const STORY_H = 1920;

export type DumpItem = { title: string; photo: string | null };

type Loader = (url: string) => Promise<HTMLImageElement | null>;

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.bezierCurveTo(cx + s * 1.1, cy - s * 0.05, cx + s * 0.55, cy - s * 0.8, cx, cy - s * 0.3);
  ctx.bezierCurveTo(cx - s * 0.55, cy - s * 0.8, cx - s * 1.1, cy - s * 0.05, cx, cy + s * 0.55);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t.trimEnd() + "…";
}

export async function drawMonthlyDump(
  canvas: HTMLCanvasElement,
  opts: { month: string; year: number; dates: number; items: DumpItem[] },
  load: Loader
) {
  const W = STORY_W, H = STORY_H;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background: burgundy gradient + soft glows
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#590016"); bg.addColorStop(0.5, "#800020"); bg.addColorStop(1, "#a7002a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow1 = ctx.createRadialGradient(W * 0.9, H * 0.08, 0, W * 0.9, H * 0.08, 760);
  glow1.addColorStop(0, "rgba(206,0,52,0.55)"); glow1.addColorStop(1, "rgba(206,0,52,0)");
  ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(W * 0.05, H * 0.95, 0, W * 0.05, H * 0.95, 800);
  glow2.addColorStop(0, "rgba(255,255,255,0.10)"); glow2.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);

  // header
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  heartPath(ctx, W / 2, 150, 34); ctx.fill();

  const title = `${opts.month} Dump`;
  let size = 128;
  ctx.fillStyle = "#ffffff";
  do { ctx.font = `800 ${size}px ${FONT}`; size -= 4; } while (ctx.measureText(title).width > W - 140 && size > 60);
  ctx.fillText(title, W / 2, 330);

  ctx.font = `600 46px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${opts.year}  ·  ${opts.dates} ${opts.dates === 1 ? "date" : "dates"}`, W / 2, 415);

  // collage
  const items = opts.items.slice(0, 9);
  const n = items.length;
  const areaX = 60, areaW = W - 120, areaY = 500, areaH = 1250, gap = 24;

  if (n === 0) {
    ctx.font = `600 44px ${FONT}`; ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("No dates this month yet", W / 2, areaY + areaH / 2);
  } else {
    const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const tileW = (areaW - gap * (cols - 1)) / cols;
    const tileH = Math.min(tileW * 1.25, (areaH - gap * (rows - 1)) / rows);
    const gridH = tileH * rows + gap * (rows - 1);
    const startY = areaY + (areaH - gridH) / 2;
    const imgs = await Promise.all(items.map((it) => (it.photo ? load(it.photo) : Promise.resolve(null))));

    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols);
      const inRow = row === rows - 1 ? n - row * cols : cols;
      const rowOffset = ((cols - inRow) * (tileW + gap)) / 2; // center a shorter last row
      const x = areaX + rowOffset + (i % cols) * (tileW + gap);
      const y = startY + row * (tileH + gap);

      ctx.save();
      roundRectPath(ctx, x, y, tileW, tileH, 36);
      ctx.clip();
      const img = imgs[i];
      if (img) {
        drawCover(ctx, img, x, y, tileW, tileH);
      } else {
        const g = ctx.createLinearGradient(x, y, x + tileW, y + tileH);
        g.addColorStop(0, "#a7002a"); g.addColorStop(1, "#590016");
        ctx.fillStyle = g; ctx.fillRect(x, y, tileW, tileH);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        heartPath(ctx, x + tileW / 2, y + tileH / 2 - 20, Math.min(tileW, tileH) * 0.22); ctx.fill();
      }
      // name label
      const fade = ctx.createLinearGradient(0, y + tileH * 0.55, 0, y + tileH);
      fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = fade; ctx.fillRect(x, y + tileH * 0.55, tileW, tileH * 0.45);
      ctx.restore();

      const fs = cols === 3 ? 30 : cols === 2 ? 38 : 48;
      ctx.font = `700 ${fs}px ${FONT}`;
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
      ctx.fillText(fitText(ctx, items[i].title, tileW - 48), x + 24, y + tileH - 26);
      ctx.textAlign = "center";

      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 4;
      roundRectPath(ctx, x, y, tileW, tileH, 36); ctx.stroke();
    }
  }

  // footer
  ctx.font = `600 36px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("LestGo", W / 2, H - 90);
}

/** Save an image: share sheet on iPhone (Save Image), normal download elsewhere. */
export async function saveImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (/iPad|iPhone|iPod/i.test(navigator.userAgent) && nav.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; }
    catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 3000);
}
