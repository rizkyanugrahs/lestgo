export const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDateStr(new Date());

export const fmtShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export const fmtLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Selisih hari dari hari ini (0 = hari ini, negatif = sudah lewat). */
export function daysUntil(dateStr: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((+new Date(dateStr + "T00:00:00") - +t) / 86400000);
}

export function countdownLabel(n: number) {
  if (n === 0) return "Hari ini";
  if (n === 1) return "Besok";
  if (n > 1) return `${n} hari lagi`;
  return `${-n} hari lalu`;
}

export function daysAgoStr(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return toDateStr(d);
}

/** Lama berpacaran: total hari + rincian tahun/bulan/hari. */
export function togetherSince(start: string) {
  const s = new Date(start + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const totalDays = Math.max(0, Math.floor((+now - +s) / 86400000));
  let y = now.getFullYear() - s.getFullYear();
  let m = now.getMonth() - s.getMonth();
  let d = now.getDate() - s.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { totalDays, years: Math.max(0, y), months: m, days: d };
}
