"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { todayStr, formatDay, formatDays } from "@/lib/dates";
import { LEAVE_TYPES, LEAVE_CLASSES, deductsBalance } from "@/lib/shifts";
import { syncLeaveToShift, findLiveConflicts, dateRange } from "@/lib/leaveSync";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import Sheet from "@/components/Sheet";
import ConfirmDialog from "@/components/ConfirmDialog";

const blank = (kind) => ({ id: null, kind, leave_type: "annual", entry_date: todayStr(), end_date: "", days: "1", note: "", legacyRange: false });

export default function LeavePage() {
  const { supabase, user } = useAuth();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank("usage"));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [conflictN, setConflictN] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("leave_entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setMsg({ type: "error", text: friendlyError(error) });
    else setRows(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const topup = rows.filter((r) => r.kind === "topup").reduce((s, r) => s + Number(r.days || 0), 0);
  const usedAnnual = rows.filter(deductsBalance).reduce((s, r) => s + Number(r.days || 0), 0);
  const sickDays = rows.filter((r) => r.kind === "usage" && r.leave_type === "sick").reduce((s, r) => s + Number(r.days || 0), 0);
  const unpaidDays = rows.filter((r) => r.kind === "usage" && r.leave_type === "unpaid").reduce((s, r) => s + Number(r.days || 0), 0);
  const balance = topup - usedAnnual;

  const shown = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "topup") return r.kind === "topup";
    if (r.kind !== "usage") return false;
    if (filter === "annual") return !r.leave_type || r.leave_type === "annual";
    return r.leave_type === filter;
  });

  function openNew(kind) { setForm(blank(kind)); setFormError(""); setOpen(true); }
  function openEdit(r) {
    setForm({
      id: r.id, kind: r.kind, leave_type: r.leave_type || "annual", entry_date: r.entry_date,
      end_date: r.end_date || "", days: String(Number(r.days)).replace(".", lang === "id" ? "," : "."), note: r.note || "", legacyRange: Boolean(r.end_date),
    });
    setFormError(""); setOpen(true);
  }

  async function doSave(force) {
    const days = Number(String(form.days).replace(",", "."));
    const multi = !form.id && form.kind === "usage" && form.end_date && form.end_date > form.entry_date;
    if (!multi && (!days || days <= 0 || isNaN(days))) { setFormError(t("leave_days_required")); return; }
    if (!form.entry_date) { setFormError(t("leave_date")); return; }
    if (form.kind === "usage" && form.end_date && form.end_date < form.entry_date) { setFormError(t("leave_end_before")); return; }
    const dates = multi ? dateRange(form.entry_date, form.end_date, 60) : [form.entry_date];
    if (dates.length > 60) { setFormError(t("leave_too_many")); return; }

    if (form.kind === "usage" && !force) {
      const conflicts = await findLiveConflicts(supabase, dates, form.id);
      if (conflicts.length) { setConflictN(conflicts.length); return; }
    }

    setSaving(true); setFormError("");
    try {
      const base = {
        kind: form.kind,
        leave_type: form.kind === "usage" ? form.leave_type : null,
        note: form.note.trim() || null,
      };
      let saved = [];
      if (form.id) {
        const payload = { ...base, entry_date: form.entry_date, end_date: form.kind === "usage" && form.legacyRange && form.end_date ? form.end_date : null, days };
        const { data, error } = await supabase.from("leave_entries").update(payload).eq("id", form.id).select().single();
        if (error) throw error;
        saved = [data];
      } else {
        const payloads = dates.map((d) => ({ ...base, user_id: user.id, entry_date: d, end_date: null, days: multi ? 1 : days }));
        const { data, error } = await supabase.from("leave_entries").insert(payloads).select();
        if (error) throw error;
        saved = data || [];
      }
      // cuti tanggal mendatang otomatis masuk jadwal shift
      let synced = false;
      for (const entry of saved) {
        if (await syncLeaveToShift(supabase, user.id, entry)) synced = true;
      }
      setOpen(false);
      setConflictN(0);
      setMsg({ type: "ok", text: synced ? t("leave_synced") : t("leave_saved") });
      load();
    } catch (e) {
      setFormError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    setToDelete(false);
    // jadwal shift yang terhubung ikut terhapus
    const { error } = await supabase.from("leave_entries").delete().eq("id", form.id);
    if (error) { setFormError(friendlyError(error)); return; }
    setOpen(false);
    setMsg({ type: "ok", text: t("leave_deleted") });
    load();
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";
  const dateText = (r) => {
    if (r.end_date && r.end_date !== r.entry_date) return formatDay(r.entry_date, lang, { day: "numeric", month: "short" }) + " – " + formatDay(r.end_date, lang, { day: "numeric", month: "short", year: "numeric" });
    return formatDay(r.entry_date, lang, { day: "numeric", month: "short", year: "numeric" });
  };
  const typeOf = (r) => (r.leave_type || "annual");
  const showRange = form.kind === "usage" && (!form.id || form.legacyRange);
  const multiPreview = !form.id && form.kind === "usage" && form.end_date && form.end_date > form.entry_date;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label={t("back")} className="glass flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("leave_title")}</h1>
      </div>

      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>

      <GlassCard>
        <p className="text-xs uppercase tracking-wide text-zinc-400">{t("leave_balance")}</p>
        <p className={"mt-1 text-4xl font-semibold tracking-tight " + (balance < 0 ? "text-red-300" : "")}>{formatDays(balance, lang)} <span className="text-lg font-normal text-zinc-400">{t("leave_unit")}</span></p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">{t("leave_total_topup")}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-300">+{formatDays(topup, lang)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-zinc-400">{t("leave_total_annual")}</p>
            <p className="mt-1 text-sm font-semibold">-{formatDays(usedAnnual, lang)}</p>
          </div>
        </div>
        {(sickDays > 0 || unpaidDays > 0) && (
          <p className="mt-3 text-xs text-zinc-400">{t("leave_other_summary").replace("{s}", formatDays(sickDays, lang)).replace("{u}", formatDays(unpaidDays, lang))} {t("leave_unit")}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => openNew("topup")} className="flex items-center justify-center gap-1 rounded-xl border border-white/10 py-2.5 text-xs text-zinc-200"><Plus size={14} />{t("leave_add_topup")}</button>
          <button onClick={() => openNew("usage")} className="flex items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-xs font-medium text-black"><Minus size={14} />{t("leave_add_usage")}</button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-5 gap-1.5">
        {[["all", t("filter_all")], ["topup", t("leave_topup")], ["annual", t("leave_filter_annual")], ["sick", t("leave_filter_sick")], ["unpaid", t("leave_filter_unpaid")]].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={"rounded-xl border py-2 text-[11px] " + (filter === k ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : shown.length === 0 ? (
        <GlassCard className="py-8 text-center text-sm text-zinc-400">{t("leave_empty")}</GlassCard>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => {
            const isTop = r.kind === "topup";
            const type = typeOf(r);
            const deducts = deductsBalance(r);
            return (
              <li key={r.id}>
                <button onClick={() => openEdit(r)} className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left">
                  <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full " + (isTop ? "bg-emerald-400/15 text-emerald-300" : LEAVE_CLASSES[type])}>{isTop ? <Plus size={16} /> : <Minus size={16} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{isTop ? t("leave_topup") : t("leave_type_" + type)} · {dateText(r)}</span>
                    {!isTop && !deducts && <span className="block text-[11px] text-zinc-500">{t("leave_no_deduct")}</span>}
                    {r.note && <span className="block truncate text-xs text-zinc-400">{r.note}</span>}
                  </span>
                  <span className={"shrink-0 text-sm font-semibold " + (isTop ? "text-emerald-300" : deducts ? "" : "text-zinc-500")}>{isTop ? "+" : deducts ? "-" : ""}{formatDays(r.days, lang)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open} title={form.id ? t("leave_edit") : form.kind === "topup" ? t("leave_add_topup") : t("leave_add_usage")} onClose={() => !saving && setOpen(false)}>
        <div className="space-y-4">
          <Notice>{formError}</Notice>
          <div>
            <p className="text-xs text-zinc-400">{t("leave_kind")}</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[["usage", t("leave_usage")], ["topup", t("leave_topup")]].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, kind: k })} className={"rounded-xl border py-2.5 text-sm " + (form.kind === k ? "border-white bg-white text-black" : "border-white/10 text-zinc-300")}>{label}</button>
              ))}
            </div>
          </div>

          {form.kind === "usage" && (
            <div>
              <p className="text-xs text-zinc-400">{t("leave_type_label")}</p>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {LEAVE_TYPES.map((k) => (
                  <button key={k} type="button" onClick={() => setForm({ ...form, leave_type: k })} className={"rounded-xl border px-1 py-2.5 text-xs " + (form.leave_type === k ? "border-white bg-white font-medium text-black" : "border-white/10 text-zinc-300")}>{t("leave_type_" + k)}</button>
                ))}
              </div>
              <p className={"mt-2 rounded-xl px-3 py-2 text-xs " + LEAVE_CLASSES[form.leave_type]}>{form.leave_type === "annual" ? t("leave_hint_annual") : t("leave_hint_other")}</p>
            </div>
          )}

          <label className="block text-xs text-zinc-400">{t("leave_date")}
            <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className={inputCls + " mt-1"} />
          </label>
          {showRange && (
            <label className="block text-xs text-zinc-400">{t("leave_end_date")}
              <input type="date" value={form.end_date} min={form.entry_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls + " mt-1"} />
              {multiPreview && <span className="mt-1 block text-[11px] text-zinc-500">{t("leave_range_hint")}</span>}
            </label>
          )}
          {!multiPreview && (
            <label className="block text-xs text-zinc-400">{t("leave_amount")}
              <input inputMode="decimal" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={inputCls + " mt-1"} />
              <span className="mt-1 block text-[11px] text-zinc-500">{t("leave_amount_hint")}</span>
            </label>
          )}
          <label className="block text-xs text-zinc-400">{t("leave_note")}
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t("leave_note_ph")} className={inputCls + " mt-1"} />
          </label>
          <div className="flex gap-2">
            {form.id && <button onClick={() => setToDelete(true)} aria-label={t("delete")} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-red-300"><Trash2 size={18} /></button>}
            <button onClick={() => doSave(false)} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-medium text-black disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}
            </button>
          </div>
        </div>
      </Sheet>
      <ConfirmDialog open={toDelete} danger message={t("leave_delete_confirm")} confirmLabel={t("delete")} onConfirm={doDelete} onCancel={() => setToDelete(false)} />
      <ConfirmDialog open={conflictN > 0} message={t("leave_conflict_confirm").replace("{n}", conflictN)} confirmLabel={t("save")} onConfirm={() => { setConflictN(0); doSave(true); }} onCancel={() => setConflictN(0)} />
    </div>
  );
}
