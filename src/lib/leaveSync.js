import { todayStr, addDays } from "@/lib/dates";

const CLEAR_SESSIONS = {
  session1_start: null, session1_end: null, session1_platform: null,
  session2_start: null, session2_end: null, session2_platform: null,
  partner: null, team: [],
};

// Tanggal-tanggal yang sudah punya jadwal live (dengan sesi) dan akan tertimpa cuti
export async function findLiveConflicts(supabase, dates, exceptLeaveEntryId) {
  const future = dates.filter((d) => d >= todayStr());
  if (!future.length) return [];
  const { data, error } = await supabase.from("shifts").select("shift_date, shift_type, session1_start, leave_entry_id").in("shift_date", future);
  if (error) return [];
  return (data || []).filter((r) => r.shift_type === "live" && r.session1_start && (!exceptLeaveEntryId || r.leave_entry_id !== exceptLeaveEntryId)).map((r) => r.shift_date);
}

// Menyamakan jadwal shift dengan satu catatan cuti.
// Cuti tanggal mendatang otomatis masuk jadwal. Tanggal yang sudah lewat tidak mengubah jadwal,
// kecuali catatan itu memang sudah terhubung ke satu hari di jadwal.
export async function syncLeaveToShift(supabase, userId, entry) {
  const { data: linked, error: e0 } = await supabase.from("shifts").select("id").eq("leave_entry_id", entry.id);
  if (e0) throw e0;
  const isUsage = entry.kind === "usage";
  const type = entry.leave_type || "annual";
  const want = isUsage && (entry.entry_date >= todayStr() || (linked && linked.length > 0));

  if (!want) {
    if (linked && linked.length) {
      const { error } = await supabase.from("shifts").delete().eq("leave_entry_id", entry.id);
      if (error) throw error;
    }
    return false;
  }

  const payload = { shift_date: entry.entry_date, shift_type: type, leave_entry_id: entry.id, note: entry.note || null, ...CLEAR_SESSIONS };

  if (linked && linked.length) {
    const keep = linked[0].id;
    const extras = linked.slice(1).map((r) => r.id);
    if (extras.length) await supabase.from("shifts").delete().in("id", extras);
    // jadwal lain di tanggal tujuan diganti
    await supabase.from("shifts").delete().eq("shift_date", entry.entry_date).neq("id", keep);
    const { error } = await supabase.from("shifts").update(payload).eq("id", keep);
    if (error) throw error;
    return true;
  }

  const { error } = await supabase.from("shifts").upsert({ ...payload, user_id: userId }, { onConflict: "user_id,shift_date" });
  if (error) throw error;
  return true;
}

// Daftar tanggal dari awal sampai akhir (termasuk keduanya)
export function dateRange(start, end, max = 60) {
  const out = [];
  let d = start;
  while (d <= end && out.length <= max) { out.push(d); d = addDays(d, 1); }
  return out;
}
