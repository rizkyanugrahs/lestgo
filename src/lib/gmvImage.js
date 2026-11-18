const FONT = "Helvetica, Arial, sans-serif";
const W = 1080;
const H = 1527; // rasio A4, supaya pas saat dijadikan PDF
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

function card(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = "rgba(23,23,23,0.95)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();
}

function pill(ctx, x, y, w, h, fill, label, border) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) { ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke(); }
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 26px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 9);
  ctx.textAlign = "left";
}

// data: { title, period, name, totalText, comparison: { text, up, note } | null,
//         stats: [{label, value}], platforms: [{label, valueText, hex, border}] | null,
//         partnerLabel, partnerText, series: number[], chartTitle, chartFrom, chartTo, footer }
export function drawGmvReport(createCanvas, data) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const inner = W - PAD * 2;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, 760);
  glow.addColorStop(0, "rgba(255,255,255,0.10)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "600 28px " + FONT;
  ctx.fillText("LIVEOPS", PAD, 86);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 60px " + FONT;
  ctx.fillText(fitText(ctx, data.title, inner), PAD, 160);
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "400 32px " + FONT;
  ctx.fillText(fitText(ctx, data.period, inner), PAD, 210);
  if (data.name) {
    ctx.fillStyle = "#d4d4d4";
    ctx.font = "500 30px " + FONT;
    ctx.fillText(fitText(ctx, data.name, inner), PAD, 252);
  }

  // Kartu total
  let y = 296;
  card(ctx, PAD, y, inner, 250);
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "600 26px " + FONT;
  ctx.fillText(data.totalLabel, PAD + 36, y + 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 82px " + FONT;
  ctx.fillText(fitText(ctx, data.totalText, inner - 72), PAD + 36, y + 148);
  if (data.comparison) {
    const c = data.comparison;
    ctx.font = "700 30px " + FONT;
    const tw = ctx.measureText(c.text).width;
    const bw = tw + 44;
    roundRect(ctx, PAD + 36, y + 176, bw, 46, 23);
    ctx.fillStyle = c.up === null ? "rgba(255,255,255,0.1)" : c.up ? "rgba(52,211,153,0.18)" : "rgba(251,113,133,0.18)";
    ctx.fill();
    ctx.fillStyle = c.up === null ? "#d4d4d4" : c.up ? "#6ee7b7" : "#fda4af";
    ctx.fillText(c.text, PAD + 58, y + 208);
    if (c.note) {
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "400 26px " + FONT;
      ctx.fillText(fitText(ctx, c.note, inner - bw - 90), PAD + 36 + bw + 18, y + 208);
    }
  }

  // Kartu statistik (3 kolom)
  y += 250 + 22;
  const cw = (inner - 2 * 18) / 3;
  data.stats.slice(0, 3).forEach((s, i) => {
    const x = PAD + i * (cw + 18);
    card(ctx, x, y, cw, 150);
    ctx.fillStyle = "#a3a3a3";
    ctx.font = "600 21px " + FONT;
    ctx.fillText(fitText(ctx, s.label.toUpperCase(), cw - 40), x + 24, y + 46);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 32px " + FONT;
    ctx.fillText(fitText(ctx, s.value, cw - 40), x + 24, y + 100);
    if (s.sub) {
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "400 22px " + FONT;
      ctx.fillText(fitText(ctx, s.sub, cw - 40), x + 24, y + 132);
    }
  });

  // Platform dan partner
  y += 150 + 22;
  const rows = (data.platforms ? 1 : 0) + 1;
  const infoH = 40 + rows * 92;
  card(ctx, PAD, y, inner, infoH);
  let iy = y + 36;
  if (data.platforms) {
    data.platforms.forEach((p, i) => {
      const colW = inner / 2;
      const x = PAD + 36 + i * colW;
      pill(ctx, x, iy, 150, 48, p.hex, p.label, p.border);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 30px " + FONT;
      ctx.fillText(fitText(ctx, p.valueText, colW - 36 - 150 - 24), x + 168, iy + 35);
    });
    iy += 92;
  }
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "600 24px " + FONT;
  ctx.fillText(data.partnerLabel, PAD + 36, iy + 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 32px " + FONT;
  ctx.fillText(fitText(ctx, data.partnerText, inner - 72), PAD + 36, iy + 62);
  y += infoH + 22;

  // Mini chart
  const chartH = H - y - 150;
  card(ctx, PAD, y, inner, chartH);
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "600 24px " + FONT;
  ctx.fillText(data.chartTitle, PAD + 36, y + 52);
  const cx = PAD + 36;
  const cy = y + 84;
  const cwid = inner - 72;
  const chh = chartH - 84 - 74;
  const series = data.series || [];
  const max = series.reduce((m, v) => Math.max(m, v), 0);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + chh);
  ctx.lineTo(cx + cwid, cy + chh);
  ctx.stroke();
  if (series.length && max > 0) {
    const gapB = series.length > 40 ? 3 : 6;
    const bw = Math.max(2, (cwid - gapB * (series.length - 1)) / series.length);
    series.forEach((v, i) => {
      const bh = v > 0 ? Math.max(6, (v / max) * chh) : 0;
      const x = cx + i * (bw + gapB);
      if (bh > 0) {
        roundRect(ctx, x, cy + chh - bh, bw, bh, Math.min(8, bw / 2));
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }
    });
  }
  ctx.fillStyle = "#71717a";
  ctx.font = "400 24px " + FONT;
  ctx.fillText(data.chartFrom || "", cx, cy + chh + 40);
  ctx.textAlign = "right";
  ctx.fillText(data.chartTo || "", cx + cwid, cy + chh + 40);
  ctx.textAlign = "left";

  ctx.fillStyle = "#52525b";
  ctx.font = "400 24px " + FONT;
  ctx.textAlign = "center";
  ctx.fillText(data.footer, W / 2, H - 56);
  ctx.textAlign = "left";
  return canvas;
}
