"use client";
import { useMe } from "./MeProvider";
import Logo from "./Logo";
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
        <div className="mx-auto mb-4 w-fit"><Logo size={64} /></div>
        <h1 className="text-2xl font-bold">Who are you?</h1>
        <p className="mt-1 text-sm text-zinc-500">Used to mark your Picks. You can change it in Settings.</p>
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
