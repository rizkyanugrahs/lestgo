"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus, Target, Radio, Loader2, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { todayStr, monthStr, monthRange, formatRupiah, taskDue, dueStatus, formatDue, sortKeyDue, daysToPayday } from "@/lib/dates";
import { friendlyError } from "@/lib/supabase";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import GmvReport from "@/components/GmvReport";
import GmvLogForm from "@/components/GmvLogForm";
import { PLATFORMS, LEAVE_COLORS, fmtTime, breakMinutes, fmtDuration, sessionList, teamList, isOff, isLeave } from "@/lib/shifts";


function TodayShift({ row, t }) {
  if (!row) return <p className="mt-2 text-lg font-semibold text-zinc-400">{t("shift_not_set")}</p>;
  if (isOff(row) || isLeave(row)) {
    const color = isLeave(row) ? LEAVE_COLORS[row.shift_type] : "#71717a";
    return (
      <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
        <span className="h-3 w-3 rounded-full" style={{ background: color }} />
        {isLeave(row) ? t("leave_type_" + row.shift_type) : t("shift_kind_off")}
      </p>
    );
  }
  const sessions = sessionList(row);
  if (!sessions.length) return <p className="mt-2 text-lg font-semibold">{t("shift_" + row.shift_type)}</p>;
  const brk = breakMinutes(row);
  const team = teamList(row);
  const people = [row.partner, ...team].filter(Boolean).join(" · ");
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        {sessions.map((s, i) => {
          const p = PLATFORMS[s.platform] || PLATFORMS.shopee;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
              <div className="h-1.5" style={{ background: p.hex === "#000000" ? "rgba(255,255,255,0.55)" : p.hex }} />
              <div className="px-3 py-2.5">
                <p className="text-[11px] text-zinc-400">{p.label}</p>
                <p className="text-base font-semibold leading-tight">{fmtTime(s.start)}<span className="text-zinc-500"> – </span>{fmtTime(s.end)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {(brk || people) && (
        <p className="mt-2 truncate text-xs text-zinc-400">
          {brk ? t("shift_break") + " " + fmtDuration(brk, { h: t("shift_unit_h"), m: t("shift_unit_m") }) : ""}{brk && people ? "  ·  " : ""}{people}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { supabase, user, profile } = useAuth();
  const { t, lang } = useI18n();
  const [ready, setReady] = useState(false);
  const [shiftRow, setShiftRow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [achieved, setAchieved] = useState(0);
  const [target, setTarget] = useState(0);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [panel, setPanel] = useState(""); // "", "target", "log"
  const [targetInput, setTargetInput] = useState("");
  const [gmvKey, setGmvKey] = useState(0);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    const month = monthStr();
    const { start, end } = monthRange(month);
    const [s, tk, g, tg] = await Promise.all([
      supabase.from("shifts").select("*").eq("shift_date", todayStr()).maybeSingle(),
      supabase.from("tasks").select("*").eq("is_done", false).order("created_at", { ascending: false }).limit(50),
      supabase.from("gmv_entries").select("amount").gte("entry_date", start).lt("entry_date", end),
      supabase.from("gmv_targets").select("*").eq("month", month).maybeSingle(),
    ]);
    const firstError = [s, tk, g, tg].find((r) => r.error);
    if (firstError) setMsg({ type: "error", text: friendlyError(firstError.error) });
    setShiftRow(s.data || null);
    const list = (tk.data || []).sort((a, b) => (a.priority === b.priority ? (sortKeyDue(a) < sortKeyDue(b) ? -1 : sortKeyDue(a) > sortKeyDue(b) ? 1 : 0) : a.priority === "urgent" ? -1 : 1)).slice(0, 5);
    setTasks(list);
    setAchieved((g.data || []).reduce((sum, r) => sum + Number(r.amount || 0), 0));
    setTarget(tg.data ? Number(tg.data.target) : 0);
    setReady(true);
  }, [supabase, user]);

  useEffect(() => { load(); }, [load]);

  async function toggleTask(task) {
    const { error } = await supabase.from("tasks").update({ is_done: true }).eq("id", task.id);
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    setTasks((prev) => prev.filter((x) => x.id !== task.id));
  }

  async function saveTarget() {
    const value = Number(String(targetInput).replace(/[^0-9]/g, ""));
    if (!value) { setMsg({ type: "error", text: lang === "id" ? "Isi target dengan angka lebih dari 0." : "Enter a target above 0." }); return; }
    const { error } = await supabase.from("gmv_targets").upsert({ user_id: user.id, month: monthStr(), target: value }, { onConflict: "user_id,month" });
    if (error) { setMsg({ type: "error", text: friendlyError(error) }); return; }
    setTarget(value); setPanel(""); setTargetInput("");
    setMsg({ type: "ok", text: t("gmv_target_saved") });
  }

  const hour = new Date().getHours();
  const greeting = hour < 11 ? t("greeting_morning") : hour < 15 ? t("greeting_afternoon") : t("greeting_evening");
  const name = profile && profile.full_name ? profile.full_name.split(" ")[0] : "";
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const toPayday = daysToPayday(profile && profile.payday);

  if (!ready) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2"><Radio size={20} /><h1 className="text-2xl font-semibold tracking-tight">LiveOps</h1></div>
          <p className="mt-1 text-sm text-zinc-400">{greeting}{name ? ", " + name : ""}</p>
        </div>
        {toPayday === null ? (
          <Link href="/profile/settings" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">{t("payday_set")}</Link>
        ) : (
          <div className="glass rounded-2xl px-3 py-1.5 text-center">
            <p className="text-lg font-semibold leading-tight">{toPayday === 0 ? t("payday_today") : t("payday_chip").replace("{n}", toPayday)}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{t("payday_label")}</p>
          </div>
        )}
      </header>

      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>

      <Link href="/tasks" className="block">
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-400">{t("shift_today")}</p>
            <ChevronRight size={16} className="text-zinc-500" />
          </div>
          <TodayShift row={shiftRow} t={t} />
        </GlassCard>
      </Link>

      <GlassCard>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t("todo_title")}</p>
          <Link href="/tasks" className="text-xs text-zinc-400">{t("todo_see_all")}</Link>
        </div>
        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">{t("todo_empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <button onClick={() => toggleTask(task)} aria-label="Selesai" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30">
                  <Check size={12} className="opacity-0" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{task.title}</span>
                  {taskDue(task) && (
                    <span className={"block text-[11px] " + (dueStatus(taskDue(task)) === "overdue" ? "text-red-300" : "text-zinc-400")}>
                      {dueStatus(taskDue(task)) === "overdue" ? t("overdue") + " · " : ""}{formatDue(taskDue(task), lang)}
                    </span>
                  )}
                </span>
                <span className={"rounded-full px-2 py-0.5 text-[10px] " + (task.priority === "urgent" ? "bg-red-400/15 text-red-300" : "bg-white/10 text-zinc-300")}>
                  {task.priority === "urgent" ? t("todo_urgent") : t("todo_normal")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium"><Target size={16} />{t("gmv_title")}</p>
          <span className="text-sm font-semibold">{target > 0 ? pct + "%" : "-"}</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className={"h-full rounded-full transition-all " + (pct >= 100 ? "bg-emerald-400" : "bg-white")} style={{ width: pct + "%" }} />
        </div>
        {target > 0 ? (
          <div className="mt-3 flex justify-between text-xs text-zinc-400">
            <span>{t("gmv_achieved")}: <b className="text-white">{formatRupiah(achieved)}</b></span>
            <span>{t("gmv_target")}: <b className="text-white">{formatRupiah(target)}</b></span>
          </div>
        ) : (
          <p className="mt-3 text-xs text-zinc-400">{t("gmv_no_target")}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={() => { setPanel(panel === "target" ? "" : "target"); setTargetInput(target ? String(target) : ""); }} className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-zinc-200">{t("gmv_set_target")}</button>
          <button onClick={() => setPanel(panel === "log" ? "" : "log")} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-2 text-xs font-medium text-black"><Plus size={14} />{t("gmv_log")}</button>
        </div>

        {panel === "target" && (
          <div className="mt-3 space-y-2">
            <input inputMode="numeric" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder={t("gmv_target") + " (Rp)"} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40" />
            <button onClick={saveTarget} className="w-full rounded-xl bg-white py-2.5 text-sm font-medium text-black">{t("save")}</button>
          </div>
        )}
        {panel === "log" && <GmvLogForm onSaved={() => { setPanel(""); setMsg({ type: "ok", text: t("gmv_saved") }); setGmvKey((k) => k + 1); load(); }} />}
      </GlassCard>

      <GmvReport refreshKey={gmvKey} />
    </div>
  );
}
