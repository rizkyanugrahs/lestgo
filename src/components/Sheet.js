"use client";
import { X } from "lucide-react";

export default function Sheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/70 md:items-center" onClick={onClose}>
      <div className="glass max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 md:rounded-3xl" style={{ background: "rgba(18,18,18,0.97)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
