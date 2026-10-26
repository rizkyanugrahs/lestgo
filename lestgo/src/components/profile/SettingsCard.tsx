"use client";
import { useState } from "react";
import { Check, Copy, LogOut } from "lucide-react";
import { useRoom } from "../RoomProvider";
import { ME_LABEL, useMe } from "../MeProvider";
import type { PersonKey } from "@/lib/types";

export default function SettingsCard() {
  const { room, unpair } = useRoom();
  const { me, setMe } = useMe();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const leave = () => {
    if (window.confirm("Keluar dari room ini? Kamu perlu kode room lagi untuk masuk kembali. Data tidak terhapus.")) unpair();
  };

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Pengaturan &amp; akun</h2>
      <div className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-500">ID Room pasangan</p>
          <button onClick={copy} className="flex w-full items-center justify-between rounded-2xl bg-violet-50 px-4 py-3">
            <span className="font-mono text-xl font-bold tracking-widest text-violet-600">{room?.code}</span>
            {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-violet-400" />}
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-500">Di perangkat ini kamu adalah</p>
          <div className="flex rounded-2xl bg-zinc-100 p-1">
            {(["kiky", "safina"] as PersonKey[]).map((k) => (
              <button key={k} onClick={() => setMe(k)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${me === k ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500"}`}>{ME_LABEL[k]}</button>
            ))}
          </div>
        </div>

        <button onClick={leave} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 font-semibold text-rose-500">
          <LogOut className="h-4 w-4" /> Log out / ganti room
        </button>
      </div>
    </section>
  );
}
