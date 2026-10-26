"use client";
import { Heart } from "lucide-react";
import { ME_LABEL, useMe } from "./MeProvider";
import type { PersonKey } from "@/lib/types";

export default function IdentityPicker() {
  const { setMe } = useMe();
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-white px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600"><Heart className="h-8 w-8 fill-white text-white" /></div>
        <h1 className="text-2xl font-bold">Kamu siapa?</h1>
        <p className="mt-1 text-sm text-zinc-500">Dipakai untuk menandai Comfort Pick-mu. Bisa diganti di Profile.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {(["kiky", "safina"] as PersonKey[]).map((k) => (
          <button key={k} onClick={() => setMe(k)}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-4 text-lg font-semibold shadow-sm transition active:scale-[0.98]">
            Aku {ME_LABEL[k]}
          </button>
        ))}
      </div>
    </div>
  );
}
