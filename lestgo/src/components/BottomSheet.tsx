"use client";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";

/**
 * Lembar pop-up bergaya liquid glass. Bisa ditutup dengan menggeser ke bawah
 * (tarik bagian atas / judul), mengetuk area gelap, atau tombol X.
 */
export default function BottomSheet({ title, onClose, children, tall = false }: {
  title: string; onClose: () => void; children: ReactNode; tall?: boolean;
}) {
  const controls = useDragControls();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-[#2a0a12]/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-white/50 bg-white/85 shadow-2xl backdrop-blur-2xl ${tall ? "h-[94dvh]" : "max-h-[92dvh]"}`}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        drag="y" dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 700) onClose(); }}
      >
        <div className="shrink-0 cursor-grab touch-none px-5 pb-2 pt-3" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="line-clamp-1 text-lg font-bold">{title}</h2>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={onClose} aria-label="Tutup"
              className="shrink-0 rounded-full bg-zinc-100 p-1.5 text-zinc-500"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">{children}</div>
      </motion.div>
    </div>,
    document.body
  );
}
