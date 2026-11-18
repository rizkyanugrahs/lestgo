"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { todayStr, monthStr, monthRange, addDays, formatDay, formatRupiah, pad } from "@/lib/dates";
import { PLATFORMS } from "@/lib/shifts";
import { drawGmvReport } from "@/lib/gmvImage";
import { jpegToPdf } from "@/lib/pdf";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";

const MODES = [["month", "gmvr_tab_month"], ["range", "gmvr_tab_range"], ["all", "gmvr_tab_all"]];

async function fetchAll(supabase, range) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase.from("gmv_entries").select("*").order("entry_date", { ascending: true });
    if (range) q = q.gte("entry_date", range.start).lt("entry_date", range.end);
    const { data, error } = await q.range(from, from + 999);
    if (error) return { error };
    all.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return { data: all };
}

function shiftMonth(m, delta) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}

// Deret angka untuk mini chart: harian untuk periode pendek, bulanan untuk periode panjang
function buildSeries(rows, mode, month, from, to) {
  const byDate = {};
  rows.forEach((r) => { byDate[r.entry_date] = Number(r.amount || 0); });
  if (mode === "month") {
    const { start, end } = monthRange(month);
    const out = [];
    for (let d = start; d < end; d = addDays(d, 1)) out.push(byDate[d] || 0);
    return { values: out, from: "1", to: String(out.length), monthly: false };
  }
  if (rows.length === 0) return { values: [], from: "", to: "", monthly: false };
  const first = mode === "range" ? from : rows[0].entry_date;
  const last = mode === "range" ? to : rows[rows.length - 1].entry_date;
  const span = Math.round((new Date(last + "T00:00:00") - new Date(first + "T00:00:00")) / 86400000) + 1;
  if (span <= 62) {
    const out = [];
    for (let d = first; d <= last; d = addDays(d, 1)) out.push(byDate[d] || 0);
    return { values: out, from: first.slice(5), to: last.slice(5), monthly: false };
  }
  const byMonth = {};
  rows.forEach((r) => { const k = r.entry_date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + Number(r.amount || 0); });
  const keys = Object.keys(byMonth).sort();
  const out = [];
  for (let m = keys[0]; m <= keys[keys.length - 1]; m = shiftMonth(m, 1)) out.push(byMonth[m] || 0);
  return { values: out, from: keys[0], to: keys[keys.length - 1], monthly: true };
}

export default function GmvReport({ refreshKey = 0 }) {
  const { supabase, profile } = useAuth();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState(monthStr());
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [prev, setPrev] = useState(null); // { total, days } bulan sebelumnya
  const [target, setTarget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [exporting, setExporting] = useState("");

  const range = useMemo(() => {
    if (mode === "month") return monthRange(month);
    if (mode === "range") return { start: from, end: addDays(to, 1) };
    return null;
  }, [mode, month, from, to]);

  const targetMonth = mode === "month" ? month : null;

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const res = await fetchAll(supabase, range);
    if (res.error) { setMsg(friendlyError(res.error)); setRows([]); }
    else { setMsg(""); setRows(res.data); }
    if (targetMonth) {
      const tg = await supabase.from("gmv_targets").select("target").eq("month", targetMonth).maybeSingle();
      setTarget(tg.data ? Number(tg.data.target) : 0);
      const pr = await fetchAll(supabase, monthRange(shiftMonth(targetMonth, -1)));
      if (pr.data) setPrev({ total: pr.data.reduce((s, r) => s + Number(r.amount || 0), 0), days: pr.data.length });
      else setPrev(null);
    } else { setTarget(0); setPrev(null); }
    setLoading(false);
  }, [supabase, range, targetMonth]);

  useEffect(() => { load(); }, [load, refreshKey]);

  function changeFrom(v) { if (!v) return; setFrom(v); if (to < v) setTo(v); }
  function changeTo(v) { if (!v) return; setTo(v); if (from > v) setFrom(v); }

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const days = rows.length;
  const avg = days ? total / days : 0;
  const best = rows.reduce((b, r) => (!b || Number(r.amount) > Number(b.amount) ? r : b), null);
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const shopeeTotal = rows.reduce((s, r) => s + Number(r.shopee_amount || 0), 0);
  const tiktokTotal = rows.reduce((s, r) => s + Number(r.tiktok_amount || 0), 0);
  const hasSplit = rows.some((r) => r.shopee_amount !== null && r.shopee_amount !== undefined || r.tiktok_amount !== null && r.tiktok_amount !== undefined);

  const partnerCounts = {};
  rows.forEach((r) => { if (r.partner) partnerCounts[r.partner] = (partnerCounts[r.partner] || 0) + 1; });
  const partnerText = Object.entries(partnerCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, c]) => n + " (" + c + " " + t("gmvr_days_unit") + ")").join(", ");

  // perbandingan dengan bulan lalu (hanya pada tampilan Bulan)
  const pctFmt = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-GB", { maximumFractionDigits: 1 });
  const prevLabel = targetMonth ? formatDay(shiftMonth(targetMonth, -1) + "-01", lang, { month: "long", year: "numeric" }) : "";
  let comparison = null;
  if (targetMonth) {
    if (prev && prev.total > 0) {
      const change = ((total - prev.total) / prev.total) * 100;
      comparison = { change, up: change > 0 ? true : change < 0 ? false : null };
    } else comparison = { none: true };
  }
  const cmpText = comparison && !comparison.none ? (comparison.up === true ? "▲ " : comparison.up === false ? "▼ " : "") + pctFmt.format(Math.abs(comparison.change)) + "%" : "";

  const monthLabel = formatDay(month + "-01", lang, { month: "long", year: "numeric" });
  const periodLabel = mode === "month" ? monthLabel : mode === "range"
    ? formatDay(from, lang, { day: "numeric", month: "short", year: "numeric" }) + (from === to ? "" : " – " + formatDay(to, lang, { day: "numeric", month: "short", year: "numeric" }))
    : t("gmvr_period_all");

  async function exportReport(kind) {
    if (!rows.length) { setMsg(t("gmvr_nothing")); return; }
    setExporting(kind);
    setMsg("");
    try {
      const series = buildSeries(rows, mode, month, from, to);
      const platforms = hasSplit ? [
        { label: PLATFORMS.shopee.label, valueText: formatRupiah(shopeeTotal), hex: PLATFORMS.shopee.hex },
        { label: PLATFORMS.tiktok.label, valueText: formatRupiah(tiktokTotal), hex: "#000000", border: true },
      ] : null;
      const canvas = drawGmvReport((w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }, {
        title: t("gmvr_report_title"),
        period: periodLabel,
        name: profile && profile.full_name ? profile.full_name : "",
        totalLabel: t("gmvr_total").toUpperCase(),
        totalText: formatRupiah(total),
        comparison: comparison ? (comparison.none ? { text: "–", up: null, note: t("gmvr_no_prev") } : { text: cmpText, up: comparison.up, note: t("gmvr_vs_last").replace("{m}", prevLabel) }) : null,
        stats: [
          { label: t("gmvr_avg"), value: formatRupiah(avg) },
          { label: t("gmvr_days"), value: String(days) },
          { label: t("gmvr_best"), value: best ? formatRupiah(best.amount) : "-", sub: best ? formatDay(best.entry_date, lang, { day: "numeric", month: "short" }) : "" },
        ],
        platforms,
        partnerLabel: t("gmvr_partner").toUpperCase(),
        partnerText: partnerText || t("gmvr_no_partner"),
        series: series.values,
        chartTitle: series.monthly ? t("gmvr_chart_monthly") : t("gmvr_chart_daily"),
        chartFrom: series.from,
        chartTo: series.to,
        footer: t("shift_image_footer"),
      });
      const baseName = "liveops-laporan-gmv-" + (mode === "month" ? month : mode === "range" ? from + "_" + to : "semua");
      const save = (blob, name) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      if (kind === "png") {
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("png");
        save(blob, baseName + ".png");
      } else {
        const jpg = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
        if (!jpg) throw new Error("jpg");
        const bytes = new Uint8Array(await jpg.arrayBuffer());
        const pdf = jpegToPdf(bytes, canvas.width, canvas.height);
        save(new Blob([pdf], { type: "application/pdf" }), baseName + ".pdf");
      }
    } catch (e) {
      setMsg(t("gmvr_export_failed") + " (" + (e.message || e) + ")");
    } finally {
      setExporting("");
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40";
  const stat = (label, value) => (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
  const exportBtn = (kind, label) => (
    <button onClick={() => exportReport(kind)} disabled={!rows.length || Boolean(exporting)} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 disabled:opacity-40">
      {exporting === kind ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}{label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("gmvr_title")}</h2>
        <div className="flex gap-2">{exportBtn("png", t("gmvr_png"))}{exportBtn("pdf", t("gmvr_pdf"))}</div>
      </div>

      <div className="glass grid grid-cols-3 rounded-full p-1">
        {MODES.map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} className={"rounded-full py-1.5 text-xs transition " + (mode === k ? "bg-white font-medium text-black" : "text-zinc-400")}>{t(label)}</button>
        ))}
      </div>

      {mode === "month" && (
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t("shift_prev")} className="glass flex h-9 w-9 items-center justify-center rounded-full"><ChevronLeft size={18} /></button>
          <button onClick={() => setMonth(monthStr())} className="text-sm font-medium capitalize">{monthLabel}</button>
          <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label={t("shift_next")} className="glass flex h-9 w-9 items-center justify-center rounded-full"><ChevronRight size={18} /></button>
        </div>
      )}
      {mode === "range" && (
        <div className="grid grid-cols-2 gap-2">
          <input type="date" aria-label={t("gmvr_from")} value={from} onChange={(e) => changeFrom(e.target.value)} className={inputCls} />
          <input type="date" aria-label={t("gmvr_to")} value={to} onChange={(e) => changeTo(e.target.value)} className={inputCls} />
        </div>
      )}

      <Notice>{msg}</Notice>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : (
        <GlassCard>
          <p className="text-xs uppercase tracking-wide text-zinc-400">{t("gmvr_total")}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{formatRupiah(total)}</p>

          {comparison && (
            <p className="mt-2 flex items-center gap-2 text-xs">
              {comparison.none ? (
                <span className="text-zinc-500">{t("gmvr_no_prev")}</span>
              ) : (
                <>
                  <span className={"flex items-center gap-1 rounded-full px-2.5 py-1 font-medium " + (comparison.up === true ? "bg-emerald-400/15 text-emerald-300" : comparison.up === false ? "bg-rose-400/15 text-rose-300" : "bg-white/10 text-zinc-300")}>
                    {comparison.up === true ? <TrendingUp size={12} /> : comparison.up === false ? <TrendingDown size={12} /> : null}{pctFmt.format(Math.abs(comparison.change))}%
                  </span>
                  <span className="text-zinc-400">{t("gmvr_vs_last").replace("{m}", prevLabel)}</span>
                </>
              )}
            </p>
          )}

          {targetMonth && target > 0 && (
            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className={"h-full rounded-full " + (pct >= 100 ? "bg-emerald-400" : "bg-white")} style={{ width: pct + "%" }} />
              </div>
              <p className="mt-2 flex justify-between text-xs text-zinc-400"><span>{t("gmvr_progress")}: <b className="text-white">{pct}%</b></span><span>{t("gmvr_target")}: <b className="text-white">{formatRupiah(target)}</b></span></p>
            </div>
          )}

          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">{t("gmvr_empty")}</p>
          ) : (
            <>
              {hasSplit && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[["shopee", shopeeTotal], ["tiktok", tiktokTotal]].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + PLATFORMS[k].cls}>{PLATFORMS[k].label}</span>
                      <p className="mt-2 text-sm font-semibold">{formatRupiah(v)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {stat(t("gmvr_days"), days)}
                {stat(t("gmvr_avg"), formatRupiah(avg))}
                {best && stat(t("gmvr_best"), formatRupiah(best.amount) + " · " + formatDay(best.entry_date, lang, { day: "numeric", month: "short" }))}
                {stat(t("gmvr_partner"), partnerText || t("gmvr_no_partner"))}
              </div>
            </>
          )}
        </GlassCard>
      )}
    </div>
  );
}
