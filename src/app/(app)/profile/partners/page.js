"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Pencil, Trash2, Check, X, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError } from "@/lib/supabase";
import { usePartners } from "@/lib/usePartners";
import GlassCard from "@/components/GlassCard";
import Notice from "@/components/Notice";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function PartnersPage() {
  const { supabase, user } = useAuth();
  const { t } = useI18n();
  const { partners, loading, error, reload } = usePartners();
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const exists = (name, exceptId) => partners.some((p) => p.id !== exceptId && p.name.trim().toLowerCase() === name.trim().toLowerCase());

  async function add() {
    const name = newName.trim();
    if (!name) { setMsg({ type: "error", text: t("partners_name_required") }); return; }
    if (exists(name)) { setMsg({ type: "error", text: t("partners_exists") }); return; }
    setBusy(true);
    const order = partners.reduce((m, p) => Math.max(m, p.sort_order || 0), 0) + 1;
    const { error: e } = await supabase.from("partners").insert({ user_id: user.id, name, is_default: partners.length === 0, sort_order: order });
    setBusy(false);
    if (e) { setMsg({ type: "error", text: friendlyError(e) }); return; }
    setNewName("");
    setMsg({ type: "ok", text: t("partners_saved") });
    reload();
  }

  async function saveEdit(p) {
    const name = editName.trim();
    if (!name) { setMsg({ type: "error", text: t("partners_name_required") }); return; }
    if (exists(name, p.id)) { setMsg({ type: "error", text: t("partners_exists") }); return; }
    const { error: e } = await supabase.from("partners").update({ name }).eq("id", p.id);
    if (e) { setMsg({ type: "error", text: friendlyError(e) }); return; }
    setEditId(null);
    setMsg({ type: "ok", text: t("partners_saved") });
    reload();
  }

  async function makeDefault(p) {
    setMsg({ type: "", text: "" });
    const clear = await supabase.from("partners").update({ is_default: false }).eq("user_id", user.id).neq("id", p.id);
    if (clear.error) { setMsg({ type: "error", text: friendlyError(clear.error) }); return; }
    const set = await supabase.from("partners").update({ is_default: true }).eq("id", p.id);
    if (set.error) { setMsg({ type: "error", text: friendlyError(set.error) }); return; }
    reload();
  }

  async function doDelete() {
    const p = toDelete;
    setToDelete(null);
    const { error: e } = await supabase.from("partners").delete().eq("id", p.id);
    if (e) { setMsg({ type: "error", text: friendlyError(e) }); return; }
    setMsg({ type: "ok", text: t("partners_deleted") });
    reload();
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-white/40";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profile/settings" aria-label={t("back")} className="glass flex h-9 w-9 items-center justify-center rounded-full"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("partners_title")}</h1>
      </div>
      <p className="text-xs text-zinc-400">{t("partners_hint")}</p>

      <Notice type={msg.type === "ok" ? "ok" : "error"}>{msg.text}</Notice>
      {error && <Notice>{friendlyError(error)}</Notice>}

      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder={t("partners_add_ph")} className={inputCls} />
        <button onClick={add} disabled={busy} className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-4 text-sm font-medium text-black disabled:opacity-60">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{t("shift_name_add")}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" /></div>
      ) : partners.length === 0 ? (
        <GlassCard className="py-8 text-center text-sm text-zinc-400">{t("partners_empty")}</GlassCard>
      ) : (
        <ul className="space-y-2">
          {partners.map((p) => (
            <li key={p.id} className="glass flex items-center gap-2 rounded-2xl p-3">
              <button onClick={() => makeDefault(p)} aria-label={t("partners_set_default")} className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full border " + (p.is_default ? "border-amber-300/60 bg-amber-300/15 text-amber-300" : "border-white/10 text-zinc-500")}>
                <Star size={16} fill={p.is_default ? "currentColor" : "none"} />
              </button>
              {editId === p.id ? (
                <>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(p); }} className={inputCls + " min-w-0 flex-1"} />
                  <button onClick={() => saveEdit(p)} aria-label={t("save")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-emerald-300"><Check size={16} /></button>
                  <button onClick={() => setEditId(null)} aria-label={t("cancel")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-300"><X size={16} /></button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.is_default && <p className="text-[11px] text-amber-300">{t("partners_default")}</p>}
                  </div>
                  <button onClick={() => { setEditId(p.id); setEditName(p.name); }} aria-label={t("partners_rename")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-300"><Pencil size={14} /></button>
                  <button onClick={() => setToDelete(p)} aria-label={t("delete")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-red-300"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={Boolean(toDelete)} danger message={t("partners_delete_confirm")} confirmLabel={t("delete")} onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
