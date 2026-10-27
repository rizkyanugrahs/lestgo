"use client";
import { Heart } from "lucide-react";
import { useMe } from "./MeProvider";
import type { PersonKey } from "@/lib/types";

const OPTIONS: { key: PersonKey; label: string; icon: string }[] = [
  { key: "kiky", label: "Kiky", icon: "👨" },
  { key: "safina", label: "Safina", icon: "👩" },
];

export default function IdentityPicker() {
  const { setMe } = useMe();
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-gradient-to-b from-[#fdf2f4] to-white px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#800020] shadow-lg shadow-wine-700/30">
          <Heart className="h-8 w-8 fill-white text-white" />
        </div>
        <h1 className="text-2xl font-bold">Kamu siapa?</h1>
        <p className="mt-1 text-sm text-zinc-500">Dipakai untuk menandai Comfort Pick-mu. Bisa diganti di Pengaturan.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {OPTIONS.map((o) => (
          <button key={o.key} onClick={() => setMe(o.key)}
            className="glass flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-semibold transition active:scale-[0.98]">
            <span className="text-2xl">{o.icon}</span> {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
