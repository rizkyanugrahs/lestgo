"use client";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Memilih nama dari daftar (atau mengetik manual). max = 1 untuk partner, 2 untuk tim.
export default function NamePicker({ label, hint, names, value, max, onChange, presets, presetsLabel }) {
  const { t } = useI18n();
  const [custom, setCustom] = useState("");
  const full = value.length >= max;
  const has = (n) => value.some((v) => v.toLowerCase() === n.toLowerCase());

  function toggle(name) {
    if (has(name)) { onChange(value.filter((v) => v.toLowerCase() !== name.toLowerCase())); return; }
    if (max === 1) { onChange([name]); return; }
    if (full) return;
    onChange([...value, name]);
  }
  function addCustom() {
    const n = custom.trim();
    if (!n) return;
    setCustom("");
    if (has(n)) return;
    if (max === 1) onChange([n]);
    else if (!full) onChange([...value, n]);
  }
  function applyPreset(list) {
    onChange(list.slice(0, max));
  }

  const suggestions = (names || []).filter((n) => !has(n));
  const chip = "rounded-full border px-3 py-1.5 text-xs";

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">{label}{hint ? <span className="text-zinc-500"> · {hint}</span> : null}</p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((n) => (
            <span key={n} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black">
              {n}
              <button type="button" onClick={() => toggle(n)} aria-label="Hapus" className="text-black/60"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}

      {presets && presets.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] text-zinc-500">{presetsLabel}</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((list) => (
              <button key={list.join("-")} type="button" onClick={() => applyPreset(list)} className={chip + " border-white/10 text-zinc-300"}>{list.join(" & ")}</button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((n) => (
            <button key={n} type="button" onClick={() => toggle(n)} disabled={full && max > 1} className={chip + " border-white/10 text-zinc-300 disabled:opacity-35"}>{n}</button>
          ))}
        </div>
      )}
      {full && max > 1 && <p className="text-[11px] text-zinc-500">{t("shift_team_max")}</p>}

      <div className="flex gap-2">
        <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder={t("shift_name_custom_ph")} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40" />
        <button type="button" onClick={addCustom} className="flex items-center gap-1 rounded-xl border border-white/10 px-3 text-xs text-zinc-200"><Plus size={14} />{t("shift_name_add")}</button>
      </div>
    </div>
  );
}
