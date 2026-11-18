import { PLATFORMS, LEAVE_COLORS, fmtTime, breakMinutes, fmtDuration, sessionList, teamList, isOff, isLeave } from "@/lib/shifts";

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

// Info tambahan di bawah sesi: partner, tim, catatan
function infoLines(item, labels) {
  const lines = [];
  const row = item.row;
  if (row) {
    const team = teamList(row);
    const parts = [];
    if (row.partner) parts.push(labels.partner + ": " + row.partner);
    if (team.length) parts.push(labels.team + ": " + team.join(", "));
    if (parts.length) lines.push(parts.join("   •   "));
    if (row.note) lines.push(row.note);
  }
  return lines;
}

function rowHeight(item, labels) {
  const row = item.row;
  if (!row) return 96;
  if (isOff(row) || isLeave(row)) return row.note ? 130 : 96;
  const sessions = sessionList(row);
  if (!sessions.length) return row.note ? 130 : 96; // jadwal lama tanpa sesi
  return 40 + sessions.length * 66 + infoLines(item, labels).length * 40 + 24;
}

function drawPill(ctx, x, y, platform) {
  const p = PLATFORMS[platform] || PLATFORMS.shopee;
  const w = 140;
  const h = 44;
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = p.hex;
  ctx.fill();
  if (platform === "tiktok") {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText(p.label, x + w / 2, y + 30);
  ctx.textAlign = "left";
}

// items: [{ day, dateText, row, highlight }]  (row = data shift atau null jika belum diatur)
export function drawShiftImage(createCanvas, { title, subtitle, name, items, footer, labels }) {
  const headerH = name ? 296 : 250;
  const gap = 14;
  const footerH = 110;
  const heights = items.map((it) => rowHeight(it, labels));
  const H = headerH + heights.reduce((a, b) => a + b + gap, 0) + footerH;
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

  const x2 = PAD + 270;
  const rightEdge = W - PAD - 32;
  let y = headerH;
  items.forEach((it, i) => {
    const h = heights[i];
    const row = it.row;
    roundRect(ctx, PAD, y, W - PAD * 2, h, 26);
    ctx.fillStyle = it.highlight ? "rgba(255,255,255,0.12)" : "rgba(23,23,23,0.95)";
    ctx.fill();
    ctx.lineWidth = it.highlight ? 2.5 : 1.5;
    ctx.strokeStyle = it.highlight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 32px " + FONT;
    ctx.fillText(fitText(ctx, it.day, 210), PAD + 32, y + 46);
    ctx.fillStyle = "#a3a3a3";
    ctx.font = "400 26px " + FONT;
    ctx.fillText(it.dateText, PAD + 32, y + 82);

    if (!row) {
      ctx.fillStyle = "#52525b";
      ctx.font = "400 34px " + FONT;
      ctx.fillText("-", x2, y + h / 2 + 12);
    } else if (isOff(row) || isLeave(row)) {
      ctx.fillStyle = isLeave(row) ? LEAVE_COLORS[row.shift_type] : "#71717a";
      ctx.beginPath();
      ctx.arc(x2 + 12, y + 48, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 34px " + FONT;
      ctx.fillText(isLeave(row) ? labels.leave(row.shift_type) : labels.off, x2 + 40, y + 60);
      if (row.note) {
        ctx.fillStyle = "#a3a3a3";
        ctx.font = "400 26px " + FONT;
        ctx.fillText(fitText(ctx, row.note, rightEdge - (x2 + 40)), x2 + 40, y + 104);
      }
    } else {
      const sessions = sessionList(row);
      if (!sessions.length) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 34px " + FONT;
        ctx.fillText(labels.legacy(row.shift_type), x2, y + 60);
        if (row.note) {
          ctx.fillStyle = "#a3a3a3";
          ctx.font = "400 26px " + FONT;
          ctx.fillText(fitText(ctx, row.note, rightEdge - x2), x2, y + 104);
        }
      } else {
        const brk = breakMinutes(row);
        let ly = y + 24;
        sessions.forEach((s, idx) => {
          drawPill(ctx, x2, ly, s.platform);
          ctx.fillStyle = "#ffffff";
          ctx.font = "700 36px " + FONT;
          ctx.fillText(fmtTime(s.start) + " - " + fmtTime(s.end), x2 + 164, ly + 34);
          if (idx === 0 && brk) {
            ctx.fillStyle = "#a3a3a3";
            ctx.font = "400 26px " + FONT;
            ctx.textAlign = "right";
            ctx.fillText(labels.breakText + " " + fmtDuration(brk, labels.units), rightEdge, ly + 33);
            ctx.textAlign = "left";
          }
          ly += 66;
        });
        ctx.fillStyle = "#d4d4d4";
        ctx.font = "400 27px " + FONT;
        infoLines(it, labels).forEach((line) => {
          ctx.fillText(fitText(ctx, line, rightEdge - x2), x2, ly + 22);
          ly += 40;
        });
      }
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
