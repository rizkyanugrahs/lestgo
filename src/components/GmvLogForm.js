"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { todayStr, formatRupiah } from "@/lib/dates";
import { PLATFORMS } from "@/lib/shifts";
import Notice from "@/components/Notice";

const num = (v) => Number(String(v || "").replace(/[^0-9]/g, "")) || 0;

// Input GMV harian untuk 2 platform sekaligus. Partner live diambil otomatis dari jadwal hari itu.
export default function GmvLogForm({ onSaved }) {
  const { supabase, user } = useAuth();
  const { t } = useI18n();
  const [date, setDate] = useState(todayStr());
  const [amounts, setAmounts] = useState({ shopee: "", tiktok: "" });
  const [order, setOrder] = useState(["shopee", "tiktok"]);
  const [partner, setPartner] = useState("");
  const [detected, setDetected] = useState(false);
  const [legacy, setLegacy] = useState(0);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // setiap tanggal berubah: cek jadwal (partner, urutan platform) dan catatan GMV yang sudah ada
  useEffect(() => {
    if (!supabase || !date) return;
    let active = true;
    setChecking(true);
    Promise.all([
      supabase.from("shifts").select("partner, session1_platform, shift_type").eq("shift_date", date).maybeSingle(),
      supabase.from("gmv_entries").select("*").eq("entry_date", date).maybeSingle(),
    ]).then(([sh, en]) => {
      if (!active) return;
      const shift = sh.data;
      const entry = en.data;
      const shiftPartner = shift && shift.shift_type === "live" && shift.partner ? shift.partner : "";
      setDetected(Boolean(shiftPartner));
      setPartner(shiftPartner || (entry && entry.partner) || "");
      const first = shift && shift.session1_platform === "tiktok" ? "tiktok" : "shopee";
      setOrder([first, first === "shopee" ? "tiktok" : "shopee"]);
      const hasSplit = entry && (entry.shopee_amount !== null || entry.tiktok_amount !== null);
      setAmounts({
        shopee: entry && entry.shopee_amount !== null && entry.shopee_amount !== undefined ? String(Number(entry.shopee_amount)) : "",
        tiktok: entry && entry.tiktok_amount !== null && entry.tiktok_amount !== undefined ? String(Number(entry.tiktok_amount)) : "",
      });
      setLegacy(entry && !hasSplit ? Number(entry.amount || 0) : 0);
      setChecking(false);
    });
    return () => { active = false; };
  }, [supabase, date]);

  const total = num(amounts.shopee) + num(amounts.tiktok);

  async function save() {
    const shopee = num(amounts.shopee);
    const tiktok = num(amounts.tiktok);
    if (!shopee && !tiktok) { setError(t("gmv_need_one")); return; }
    setSaving(true); setError("");
    const { error: e } = await supabase.from("gmv_entries").upsert({
      user_id: user.id,
      entry_date: date,
      shopee_amount: amounts.shopee.trim() === "" ? null : shopee,
      tiktok_amount: amounts.tiktok.trim() === "" ? null : tiktok,
      amount: shopee + tiktok,
      partner: partner.trim() || null,
    }, { onConflict: "user_id,entry_date" });
    setSaving(false);
    if (e) { setError(friendlyError(e)); return; }
    setAmounts({ shopee: "", tiktok: "" });
    setLegacy(0);
    onSaved();
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";
  return (
    <div className="mt-3 space-y-3">
      <Notice>{error}</Notice>
      <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={inputCls} />
      {checking && <p className="text-[11px] text-zinc-500">{t("gmv_loading_date")}</p>}
      {legacy > 0 && <p className="rounded-xl bg-amber-300/10 px-3 py-2 text-xs text-amber-200">{t("gmv_legacy_note").replace("{n}", formatRupiah(legacy))}</p>}

      <div className="space-y-2">
        {order.map((k) => {
          const p = PLATFORMS[k];
          return (
            <div key={k} className="flex items-center gap-2">
              <span className={"w-20 shrink-0 rounded-full py-1.5 text-center text-xs font-medium " + p.cls}>{p.label}</span>
              <input inputMode="numeric" value={amounts[k]} onChange={(e) => setAmounts({ ...amounts, [k]: e.target.value })} placeholder="Rp 0" className={inputCls} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <span className="text-xs text-zinc-400">{t("gmv_total_calc")}</span>
        <span className="text-sm font-semibold">{formatRupiah(total)}</span>
      </div>

      <label className="block text-xs text-zinc-400">{t("gmv_partner")}
        <input value={partner} onChange={(e) => setPartner(e.target.value)} className={inputCls + " mt-1"} />
        <span className="mt-1 block text-[11px] text-zinc-500">{detected ? t("gmv_partner_auto") : t("gmv_partner_none")}</span>
      </label>

      <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black disabled:opacity-60">
        {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}
      </button>
    </div>
  );
}
