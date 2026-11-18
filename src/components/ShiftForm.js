"use client";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { usePartners } from "@/lib/usePartners";
import { TIME_TEMPLATES, TEAM_TEMPLATES, PLATFORMS, LEAVE_TYPES, LEAVE_CLASSES, otherPlatform, fmtTime, durationMinutes, fmtDuration, breakMinutes, sessionsOverlap, isLeaveType } from "@/lib/shifts";
import Sheet from "@/components/Sheet";
import Notice from "@/components/Notice";
import NamePicker from "@/components/NamePicker";

const blank = (date) => ({ id: null, leave_entry_id: null, shift_date: date, kind: "live", lastLeave: "annual", s1: { start: "", end: "" }, s2: { start: "", end: "" }, first: "shopee", partner: [], team: [], note: "" });

const seg = (active) => "rounded-xl border py-2.5 text-sm transition " + (active ? "border-white bg-white font-medium text-black" : "border-white/10 text-zinc-300");

export default function ShiftForm({ open, initial, defaultDate, onClose, onSaved, onDelete }) {
  const { supabase, user } = useAuth();
  const { t } = useI18n();
  const { partners, defaultPartner } = usePartners();
  const [form, setForm] = useState(blank(defaultDate));
  const [sessionTab, setSessionTab] = useState(1);
  const [peopleTab, setPeopleTab] = useState("partner");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(""); setSessionTab(1); setPeopleTab("partner");
    if (initial) {
      const kind = initial.shift_type === "off" || isLeaveType(initial.shift_type) ? initial.shift_type : "live";
      setForm({
        id: initial.id,
        leave_entry_id: initial.leave_entry_id || null,
        shift_date: initial.shift_date,
        kind,
        lastLeave: isLeaveType(kind) ? kind : "annual",
        s1: { start: initial.session1_start || "", end: initial.session1_end || "" },
        s2: { start: initial.session2_start || "", end: initial.session2_end || "" },
        first: initial.session2_platform === "shopee" ? "tiktok" : "shopee",
        partner: initial.partner ? [initial.partner] : [],
        team: Array.isArray(initial.team) ? initial.team : [],
        note: initial.note || "",
      });
    } else {
      setForm({ ...blank(defaultDate), partner: defaultPartner ? [defaultPartner.name] : [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultDate]);

  const group = isLeaveType(form.kind) ? "leave" : form.kind;
  const p1 = form.first;
  const p2 = otherPlatform(form.first);
  const names = partners.map((p) => p.name);
  const units = { h: t("shift_unit_h"), m: t("shift_unit_m") };
  const preview = form.s1.start && form.s2.start ? { session1_start: form.s1.start, session1_end: form.s1.end, session2_start: form.s2.start, session2_end: form.s2.end } : null;
  const brk = preview ? breakMinutes(preview) : null;
  const sess = sessionTab === 1 ? form.s1 : form.s2;
  const setSess = (v) => setForm({ ...form, [sessionTab === 1 ? "s1" : "s2"]: v });
  const sessText = (s) => (s.start && s.end ? fmtTime(s.start) + " - " + fmtTime(s.end) : t("shift_session_empty"));
  const dur = durationMinutes(sess.start, sess.end);

  async function save() {
    if (!form.shift_date) { setError(t("shift_date")); return; }
    if (form.kind === "live") {
      const { s1, s2 } = form;
      if (!s1.start || !s1.end || !s2.start || !s2.end) { setError(t("shift_sessions_required")); return; }
      if (s1.start === s1.end || s2.start === s2.end) { setError(t("shift_session_same")); return; }
      if (sessionsOverlap({ session1_start: s1.start, session1_end: s1.end, session2_start: s2.start, session2_end: s2.end })) { setError(t("shift_session_overlap")); return; }
    }
    setSaving(true); setError("");
    try {
      // Jika di tanggal itu sudah ada jadwal, anggap sedang mengedit jadwal tersebut
      let shiftId = form.id;
      let linkedEntry = form.leave_entry_id;
      if (!shiftId) {
        const { data: ex } = await supabase.from("shifts").select("id, leave_entry_id").eq("shift_date", form.shift_date).maybeSingle();
        if (ex) { shiftId = ex.id; linkedEntry = ex.leave_entry_id || null; }
      }

      let payload;
      let entryId = null;
      if (isLeaveType(form.kind)) {
        // catat cuti di riwayat (Annual Leave otomatis mengurangi saldo)
        const entryPayload = { kind: "usage", leave_type: form.kind, entry_date: form.shift_date, end_date: null, note: form.note.trim() || null };
        if (linkedEntry) {
          const { error: e1 } = await supabase.from("leave_entries").update(entryPayload).eq("id", linkedEntry);
          if (e1) throw e1;
          entryId = linkedEntry;
        } else {
          const { data: created, error: e2 } = await supabase.from("leave_entries").insert({ ...entryPayload, days: 1, user_id: user.id }).select("id").single();
          if (e2) throw e2;
          entryId = created.id;
        }
        payload = {
          shift_date: form.shift_date, shift_type: form.kind, note: form.note.trim() || null, leave_entry_id: entryId,
          session1_start: null, session1_end: null, session1_platform: null, session2_start: null, session2_end: null, session2_platform: null, partner: null, team: [],
        };
      } else if (form.kind === "off") {
        payload = {
          shift_date: form.shift_date, shift_type: "off", note: form.note.trim() || null, leave_entry_id: null,
          session1_start: null, session1_end: null, session1_platform: null, session2_start: null, session2_end: null, session2_platform: null, partner: null, team: [],
        };
      } else {
        payload = {
          shift_date: form.shift_date, shift_type: "live", note: form.note.trim() || null, leave_entry_id: null,
          session1_start: form.s1.start, session1_end: form.s1.end, session1_platform: p1,
          session2_start: form.s2.start, session2_end: form.s2.end, session2_platform: p2,
          partner: form.partner[0] || null, team: form.team.slice(0, 2),
        };
      }

      const res = shiftId
        ? await supabase.from("shifts").update(payload).eq("id", shiftId)
        : await supabase.from("shifts").upsert({ ...payload, user_id: user.id }, { onConflict: "user_id,shift_date" });
      if (res.error) {
        if (isLeaveType(form.kind) && entryId && !linkedEntry) await supabase.from("leave_entries").delete().eq("id", entryId);
        throw res.error;
      }
      // dari cuti kembali ke Live/Off Day: hapus catatan cuti (saldo kembali)
      if (!isLeaveType(form.kind) && linkedEntry) await supabase.from("leave_entries").delete().eq("id", linkedEntry);
      onSaved();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";
  const tabBtn = (active) => "rounded-2xl border p-2.5 text-left transition " + (active ? "border-white bg-white text-black" : "border-white/10 text-zinc-300");

  return (
    <Sheet open={open} title={form.id ? t("shift_edit_title") : t("shift_add")} onClose={() => !saving && onClose()}>
      <div className="space-y-4">
        <Notice>{error}</Notice>

        <label className="block text-xs text-zinc-400">{t("shift_date")}
          <input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} className={inputCls + " mt-1"} />
        </label>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setForm({ ...form, kind: "live" })} className={seg(group === "live")}>{t("shift_kind_live")}</button>
          <button type="button" onClick={() => setForm({ ...form, kind: "off" })} className={seg(group === "off")}>{t("shift_kind_off")}</button>
          <button type="button" onClick={() => setForm({ ...form, kind: form.lastLeave })} className={seg(group === "leave")}>{t("shift_kind_leave")}</button>
        </div>

        {group === "leave" && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {LEAVE_TYPES.map((k) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, kind: k, lastLeave: k })} className={"rounded-xl border px-1 py-2.5 text-xs " + (form.kind === k ? "border-white bg-white font-medium text-black" : "border-white/10 text-zinc-300")}>{t("leave_type_" + k)}</button>
              ))}
            </div>
            <p className={"rounded-xl px-3 py-2 text-xs " + LEAVE_CLASSES[form.kind]}>{form.kind === "annual" ? t("leave_hint_annual") : t("leave_hint_other")}</p>
          </div>
        )}

        {group === "live" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[["shopee", t("shift_order_shopee_first")], ["tiktok", t("shift_order_tiktok_first")]].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, first: k })} className={"rounded-xl border py-2 text-xs " + (form.first === k ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label}</button>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((n) => {
                  const plat = PLATFORMS[n === 1 ? p1 : p2];
                  const active = sessionTab === n;
                  return (
                    <button key={n} type="button" onClick={() => setSessionTab(n)} className={tabBtn(active)}>
                      <span className="flex items-center gap-2 text-xs font-medium">
                        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40" style={{ background: plat.hex }} />
                        {t("shift_session").replace("{n}", n)} · {plat.label}
                      </span>
                      <span className={"mt-0.5 block text-[11px] " + (active ? "text-black/70" : "text-zinc-500")}>{sessText(n === 1 ? form.s1 : form.s2)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {TIME_TEMPLATES.map(([a, b]) => {
                  const active = sess.start === a && sess.end === b;
                  return (
                    <button key={a + b} type="button" onClick={() => setSess({ start: a, end: b })} className={"rounded-lg border px-1 py-2 text-[11px] leading-tight " + (active ? "border-white bg-white font-medium text-black" : "border-white/10 text-zinc-300")}>
                      {fmtTime(a)}<br />{fmtTime(b)}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-zinc-400">{t("shift_start")}
                  <input type="time" value={sess.start} onChange={(e) => setSess({ ...sess, start: e.target.value })} className={inputCls + " mt-1"} />
                </label>
                <label className="text-xs text-zinc-400">{t("shift_end")}{dur ? <span className="text-zinc-500"> · {fmtDuration(dur, units)}</span> : null}
                  <input type="time" value={sess.end} onChange={(e) => setSess({ ...sess, end: e.target.value })} className={inputCls + " mt-1"} />
                </label>
              </div>
              {brk ? <p className="text-center text-xs text-zinc-400">{t("shift_break")} {fmtDuration(brk, units)}</p> : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPeopleTab("partner")} className={tabBtn(peopleTab === "partner")}>
                  <span className="block text-xs font-medium">{t("shift_partner")}</span>
                  <span className={"mt-0.5 block truncate text-[11px] " + (peopleTab === "partner" ? "text-black/70" : "text-zinc-500")}>{form.partner[0] || t("shift_people_empty")}</span>
                </button>
                <button type="button" onClick={() => setPeopleTab("team")} className={tabBtn(peopleTab === "team")}>
                  <span className="block text-xs font-medium">{t("shift_tab_team")}</span>
                  <span className={"mt-0.5 block truncate text-[11px] " + (peopleTab === "team" ? "text-black/70" : "text-zinc-500")}>{form.team.length ? form.team.join(", ") : t("shift_people_empty")}</span>
                </button>
              </div>
              {peopleTab === "partner" ? (
                <NamePicker label={t("shift_partner")} hint={t("shift_partner_note")} names={names} value={form.partner} max={1} onChange={(v) => setForm({ ...form, partner: v })} />
              ) : (
                <NamePicker label={t("shift_team")} names={names} value={form.team} max={2} presets={TEAM_TEMPLATES} presetsLabel={t("shift_team_templates")} onChange={(v) => setForm({ ...form, team: v })} />
              )}
            </div>
          </>
        )}

        <label className="block text-xs text-zinc-400">{t("shift_note")}
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t("shift_note_ph")} className={inputCls + " mt-1"} />
        </label>

        <div className="flex gap-2">
          {form.id && (
            <button onClick={() => onDelete(form.id)} aria-label={t("delete")} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-red-300"><Trash2 size={18} /></button>
          )}
          <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
