export function pad(n) { return String(n).padStart(2, "0"); }

export function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export function monthStr(d = new Date()) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}

export function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  const start = y + "-" + pad(m) + "-01";
  const next = new Date(y, m, 1);
  const end = next.getFullYear() + "-" + pad(next.getMonth() + 1) + "-01";
  return { start, end };
}

export function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);
}

export function tenureParts(joinDate) {
  if (!joinDate) return null;
  const start = new Date(joinDate + "T00:00:00");
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) return null;
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days };
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// Senin sebagai awal minggu
export function weekStart(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7;
  return addDays(dateStr, -day);
}

export function formatDay(dateStr, lang, opts) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", opts || { weekday: "short", day: "numeric", month: "short" }).format(d);
}

export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

export function deadlineStatus(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  if (d < now) return "overdue";
  if (d.toDateString() === now.toDateString()) return "today";
  return "later";
}

export function formatDeadline(iso, lang) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// Sisa waktu dari hari ini sampai tanggal tertentu (untuk kontrak berakhir)
export function remainingParts(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate + "T00:00:00");
  const today = dateOnly(new Date());
  if (isNaN(end.getTime())) return null;
  if (end < today) return { expired: true };
  if (end.getTime() === today.getTime()) return { today: true, years: 0, months: 0, days: 0 };
  let years = end.getFullYear() - today.getFullYear();
  let months = end.getMonth() - today.getMonth();
  let days = end.getDate() - today.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days };
}

// Contoh hasil: "1 thn 3 bln 5 hr" (satuan yang nol di depan dilewati)
export function formatParts(p, labels) {
  if (!p) return "";
  const out = [];
  if (p.years > 0) out.push(p.years + " " + labels.years);
  if (p.years > 0 || p.months > 0) out.push(p.months + " " + labels.months);
  out.push(p.days + " " + labels.days);
  return out.join(" ");
}

// Jumlah hari menuju gajian berikutnya. Bulan pendek memakai tanggal terakhir bulan itu.
export function daysToPayday(payday) {
  const p = Number(payday);
  if (!p || p < 1 || p > 31) return null;
  const today = dateOnly(new Date());
  const pick = (y, m) => new Date(y, m, Math.min(p, new Date(y, m + 1, 0).getDate()));
  let target = pick(today.getFullYear(), today.getMonth());
  if (target < today) target = pick(today.getFullYear(), today.getMonth() + 1);
  return Math.round((target - today) / 86400000);
}

export function formatDays(n, lang) {
  const v = Math.round(Number(n || 0) * 100) / 100;
  const s = String(v);
  return lang === "id" ? s.replace(".", ",") : s;
}

// ---- Tenggat tugas: tanggal wajib, jam opsional ----
// Mengembalikan { date: "YYYY-MM-DD", time: "HH:MM" | null } dari data baru atau data lama (timestamp)
export function taskDue(task) {
  if (!task) return null;
  if (task.deadline_date) return { date: task.deadline_date, time: task.deadline_time || null };
  if (task.deadline) {
    const d = new Date(task.deadline);
    if (isNaN(d.getTime())) return null;
    return { date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), time: pad(d.getHours()) + ":" + pad(d.getMinutes()) };
  }
  return null;
}

export function dueStatus(due) {
  if (!due) return null;
  const today = todayStr();
  if (due.date < today) return "overdue";
  if (due.date > today) return "later";
  if (due.time) {
    const now = new Date();
    return due.time < pad(now.getHours()) + ":" + pad(now.getMinutes()) ? "overdue" : "today";
  }
  return "today";
}

export function formatDue(due, lang) {
  if (!due) return "";
  const d = new Date(due.date + "T00:00:00");
  const text = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short" }).format(d);
  return due.time ? text + ", " + due.time.replace(":", ".") : text;
}

export function sortKeyDue(task) {
  const due = taskDue(task);
  return due ? due.date + "T" + (due.time || "23:59") : "9999";
}
