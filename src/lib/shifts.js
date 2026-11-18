// Template jam sesi live
export const TIME_TEMPLATES = [
  ["06:00", "08:00"],
  ["08:00", "11:00"],
  ["11:00", "13:00"],
  ["13:00", "15:00"],
  ["15:00", "18:00"],
  ["18:00", "20:00"],
  ["20:00", "22:00"],
  ["22:00", "00:00"],
];

// Template tim / pasangan yang sering bareng (bisa diubah manual di form)
export const TEAM_TEMPLATES = [
  ["Hilda", "Anggoro"],
  ["Syafa", "Albin"],
  ["Nay", "Syifa"],
  ["Angel", "Lesvia"],
  ["Abel", "Olip"],
  ["Sophia", "Putri"],
  ["Tiara"],
  ["Nadila"],
];

// Daftar awal partner. Aqshal = partner utama (default)
export const DEFAULT_PARTNERS = ["Aqshal", ...TEAM_TEMPLATES.flat()];
export const DEFAULT_PARTNER_NAME = "Aqshal";

export const PLATFORMS = {
  shopee: { label: "Shopee", hex: "#f97316", cls: "bg-orange-500 text-white" },
  tiktok: { label: "TikTok", hex: "#000000", cls: "bg-black text-white ring-1 ring-white/50" },
};

export function otherPlatform(p) { return p === "shopee" ? "tiktok" : "shopee"; }

// "08:00" -> "08.00"
export function fmtTime(v) { return v ? String(v).slice(0, 5).replace(":", ".") : ""; }

export function toMinutes(v) {
  if (!v) return null;
  const [h, m] = String(v).split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// Mengembalikan [mulai, selesai) dalam menit. Selesai 00:00 dihitung 24:00.
export function sessionSpan(start, end) {
  const a = toMinutes(start);
  let b = toMinutes(end);
  if (a === null || b === null) return null;
  if (b <= a) b += 1440;
  return [a, b];
}

export function durationMinutes(start, end) {
  const s = sessionSpan(start, end);
  return s ? s[1] - s[0] : null;
}

// Rentang kedua sesi dalam satu garis waktu (sesi 2 dianggap hari berikutnya jika mulainya lebih awal)
function spans(row) {
  const s1 = sessionSpan(row.session1_start, row.session1_end);
  const s2raw = sessionSpan(row.session2_start, row.session2_end);
  if (!s1 || !s2raw) return null;
  let s2 = s2raw;
  if (s2[0] < s1[0]) s2 = [s2[0] + 1440, s2[1] + 1440];
  return [s1, s2];
}

export function sessionsOverlap(row) {
  const sp = spans(row);
  return sp ? sp[1][0] < sp[0][1] : false;
}

export function breakMinutes(row) {
  const sp = spans(row);
  if (!sp) return null;
  const gap = sp[1][0] - sp[0][1];
  return gap > 0 ? gap : null;
}

export function fmtDuration(mins, units) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return h + units.h + " " + m + units.m;
  if (h) return h + units.h;
  return m + units.m;
}

export function isOff(row) { return row && row.shift_type === "off"; }
export function isLive(row) { return row && row.shift_type === "live"; }
export function hasSessions(row) { return Boolean(row && row.session1_start && row.session2_start); }

// Sesi dalam bentuk daftar untuk ditampilkan
export function sessionList(row) {
  if (!hasSessions(row)) return [];
  return [
    { start: row.session1_start, end: row.session1_end, platform: row.session1_platform || "shopee" },
    { start: row.session2_start, end: row.session2_end, platform: row.session2_platform || "tiktok" },
  ];
}

export function teamList(row) { return Array.isArray(row && row.team) ? row.team : []; }

// Jenis cuti. Annual Leave mengurangi saldo; Sick dan Unpaid hanya tercatat di riwayat.
export const LEAVE_TYPES = ["annual", "sick", "unpaid"];
export const LEAVE_COLORS = { annual: "#34d399", sick: "#fb7185", unpaid: "#fbbf24" };
export const LEAVE_CLASSES = {
  annual: "bg-emerald-400/15 text-emerald-300",
  sick: "bg-rose-400/15 text-rose-300",
  unpaid: "bg-amber-300/15 text-amber-200",
};

export function isLeaveType(type) { return LEAVE_TYPES.includes(type); }
export function isLeave(row) { return Boolean(row && isLeaveType(row.shift_type)); }
// Off Day atau cuti: tidak ada sesi live
export function isDayOff(row) { return isOff(row) || isLeave(row); }
// Entri cuti yang memotong saldo (entri lama tanpa jenis dianggap Annual)
export function deductsBalance(entry) {
  return entry.kind === "usage" && (!entry.leave_type || entry.leave_type === "annual");
}
