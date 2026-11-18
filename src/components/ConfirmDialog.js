"use client";
import { useI18n } from "@/lib/i18n";

export default function ConfirmDialog({ open, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
      <div className="glass w-full max-w-sm rounded-2xl p-5">
        <p className="text-sm text-white">{message}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300">{t("cancel")}</button>
          <button onClick={onConfirm} className={"flex-1 rounded-xl py-2.5 text-sm font-medium " + (danger ? "bg-red-500/90 text-white" : "bg-white text-black")}>{confirmLabel || "OK"}</button>
        </div>
      </div>
    </div>
  );
}
