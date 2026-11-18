"use client";
import { useState } from "react";
import { Plus, Upload, Download, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { parseCSV, rowsToProducts, toCSV, downloadText, PRODUCT_FIELDS, PRODUCT_HEADERS } from "@/lib/csv";
import Sheet from "@/components/Sheet";
import Notice from "@/components/Notice";

export default function ProductManage({ open, products, onClose, onAdd, onImported }) {
  const { supabase } = useAuth();
  const { t } = useI18n();
  const [pending, setPending] = useState(null); // { ready: [], skipped: n }
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  function reset() { setPending(null); setMsg({ type: "", text: "" }); }
  function close() { reset(); onClose(); }

  function exportCsv() {
    if (!products.length) { setMsg({ type: "error", text: t("prod_export_empty") }); return; }
    const rows = [PRODUCT_HEADERS, ...products.map((p) => PRODUCT_FIELDS.map((f) => p[f] || ""))];
    downloadText("liveops-produk.csv", toCSV(rows));
  }
  function template() {
    downloadText("liveops-template-produk.csv", toCSV([PRODUCT_HEADERS, ["Contoh Serum Brightening", "Serum", "Niacinamide, Vitamin C", "Mencerahkan kulit", "Pakai 2x sehari setelah toner", "17+ tahun", "Jangan digabung dengan retinol"]]));
  }

  async function pickFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setMsg({ type: "", text: "" });
    try {
      const text = await f.text();
      const all = rowsToProducts(parseCSV(text));
      const existing = new Set(products.map((p) => p.name.trim().toLowerCase()));
      const seen = new Set();
      const ready = [];
      let skipped = 0;
      for (const r of all) {
        const key = r.name.trim().toLowerCase();
        if (!key || existing.has(key) || seen.has(key)) { skipped++; continue; }
        seen.add(key);
        ready.push({
          name: r.name.trim(),
          category: r.category || null,
          key_ingredients: r.key_ingredients || null,
          benefits: r.benefits || null,
          how_to_use: r.how_to_use || null,
          age_range: r.age_range || null,
          contraindications: r.contraindications || null,
        });
      }
      if (!ready.length) { setMsg({ type: "error", text: t("prod_import_empty") }); setPending(null); return; }
      setPending({ ready, skipped });
    } catch (err) {
      setMsg({ type: "error", text: friendlyError(err) });
    }
  }

  async function doImport() {
    setBusy(true);
    try {
      for (let i = 0; i < pending.ready.length; i += 100) {
        const { error } = await supabase.from("products").insert(pending.ready.slice(i, i + 100));
        if (error) throw error;
      }
      const n = pending.ready.length;
      reset();
      setMsg({ type: "ok", text: t("prod_import_done").replace("{n}", n) });
      onImported();
    } catch (err) {
      setMsg({ type: "error", text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  const btn = "flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left text-sm";
  return (
    <Sheet open={open} title={t("prod_manage_title")} onClose={close}>
      <div className="space-y-3">
        <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>
        <button onClick={() => { reset(); onAdd(); }} className={btn + " bg-white text-black"}><Plus size={18} />{t("prod_add")}</button>
        <label className={btn + " cursor-pointer"}>
          <Upload size={18} className="text-zinc-300" />{t("prod_import")}
          <input type="file" accept=".csv,text/csv" onChange={pickFile} className="hidden" />
        </label>
        <p className="px-1 text-xs text-zinc-500">{t("prod_import_hint")}</p>
        {pending && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
            <p>{t("prod_import_ready").replace("{n}", pending.ready.length)}</p>
            {pending.skipped > 0 && <p className="text-xs text-zinc-400">{t("prod_import_skip").replace("{n}", pending.skipped)}</p>}
            <button onClick={doImport} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black disabled:opacity-60">
              {busy && <Loader2 size={16} className="animate-spin" />}{t("prod_import_confirm")}
            </button>
          </div>
        )}
        <button onClick={exportCsv} className={btn}><Download size={18} className="text-zinc-300" />{t("prod_export")}</button>
        <button onClick={template} className={btn}><FileText size={18} className="text-zinc-300" />{t("prod_template")}</button>
      </div>
    </Sheet>
  );
}
