const FONT = "Helvetica, Arial, sans-serif";
const W = 1080;
const PAD = 56;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxWidth) s = s.slice(0, -1);
  return s + "…";
}

// Memecah teks menjadi beberapa baris (maksimal maxLines)
function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width <= maxWidth) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = fitText(ctx, lines[maxLines - 1] + " …", maxWidth);
  }
  return lines.map((l) => fitText(ctx, l, maxWidth));
}

// items: [{ title, notes, done, urgent, priorityLabel, dueText, dueState: "overdue"|"today"|"later"|null }]
export function drawTodoImage(createCanvas, { title, subtitle, name, items, footer, emptyText }) {
  const measure = createCanvas(W, 10).getContext("2d");
  const textX = PAD + 96;
  const textW = W - PAD - 40 - textX;
  const gap = 14;
  const heights = items.map((it) => {
    measure.font = "700 32px " + FONT;
    const t = wrap(measure, it.title, textW, 2);
    measure.font = "400 26px " + FONT;
    const n = it.notes ? wrap(measure, it.notes, textW, 2) : [];
    it._t = t;
    it._n = n;
    return 34 + t.length * 42 + n.length * 34 + 62;
  });
  const headerH = name ? 296 : 250;
  const bodyH = items.length ? heights.reduce((a, b) => a + b + gap, 0) : 140;
  const H = headerH + bodyH + 110;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, 700);
  glow.addColorStop(0, "rgba(255,255,255,0.10)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 700);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "600 28px " + FONT;
  ctx.fillText("LIVEOPS", PAD, 86);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 60px " + FONT;
  ctx.fillText(fitText(ctx, title, W - PAD * 2), PAD, 160);
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "400 32px " + FONT;
  ctx.fillText(fitText(ctx, subtitle, W - PAD * 2), PAD, 210);
  if (name) {
    ctx.fillStyle = "#d4d4d4";
    ctx.font = "500 30px " + FONT;
    ctx.fillText(fitText(ctx, name, W - PAD * 2), PAD, 252);
  }

  let y = headerH;
  if (!items.length) {
    ctx.fillStyle = "#71717a";
    ctx.font = "400 32px " + FONT;
    ctx.fillText(emptyText || "", PAD, y + 60);
  }
  items.forEach((it, i) => {
    const h = heights[i];
    roundRect(ctx, PAD, y, W - PAD * 2, h, 26);
    ctx.fillStyle = "rgba(23,23,23,0.95)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    // lingkaran centang
    const cx = PAD + 52;
    const cy = y + 52;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    if (it.done) {
      ctx.fillStyle = "rgba(52,211,153,0.2)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#34d399";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 1);
      ctx.lineTo(cx - 2, cy + 8);
      ctx.lineTo(cx + 10, cy - 7);
      ctx.stroke();
    } else {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.stroke();
    }

    let ty = y + 56;
    ctx.fillStyle = it.done ? "#71717a" : "#ffffff";
    ctx.font = "700 32px " + FONT;
    it._t.forEach((line) => {
      ctx.fillText(line, textX, ty);
      if (it.done) {
        const w = ctx.measureText(line).width;
        ctx.fillRect(textX, ty - 11, w, 2);
      }
      ty += 42;
    });
    ctx.fillStyle = "#a3a3a3";
    ctx.font = "400 26px " + FONT;
    it._n.forEach((line) => { ctx.fillText(line, textX, ty - 4); ty += 34; });

    // chip prioritas dan tenggat
    let cxp = textX;
    const chipY = y + h - 58;
    ctx.font = "600 22px " + FONT;
    const pw = ctx.measureText(it.priorityLabel).width + 36;
    roundRect(ctx, cxp, chipY, pw, 40, 20);
    ctx.fillStyle = it.urgent ? "rgba(251,113,133,0.2)" : "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.fillStyle = it.urgent ? "#fda4af" : "#d4d4d4";
    ctx.fillText(it.priorityLabel, cxp + 18, chipY + 28);
    cxp += pw + 12;
    if (it.dueText) {
      const dw = ctx.measureText(it.dueText).width + 36;
      roundRect(ctx, cxp, chipY, dw, 40, 20);
      ctx.fillStyle = it.dueState === "overdue" ? "rgba(251,113,133,0.2)" : it.dueState === "today" ? "rgba(252,211,77,0.2)" : "rgba(255,255,255,0.1)";
      ctx.fill();
      ctx.fillStyle = it.dueState === "overdue" ? "#fda4af" : it.dueState === "today" ? "#fde68a" : "#d4d4d4";
      ctx.fillText(it.dueText, cxp + 18, chipY + 28);
    }
    y += h + gap;
  });

  ctx.fillStyle = "#52525b";
  ctx.font = "400 24px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText(footer, W / 2, H - 50);
  ctx.textAlign = "left";
  return canvas;
}
