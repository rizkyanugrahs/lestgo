"use client";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Notice({ type = "error", children }) {
  if (!children) return null;
  const ok = type === "ok";
  return (
    <div className={"flex items-start gap-2 rounded-xl border px-3 py-2 text-sm " + (ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-400/30 bg-red-400/10 text-red-300")}>
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
      <span className="break-words">{children}</span>
    </div>
  );
}
