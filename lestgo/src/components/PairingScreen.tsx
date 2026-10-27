"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Sparkles } from "lucide-react";
import { createRoom, joinRoom, type StoredRoom } from "@/lib/room";
import { useRoom } from "./RoomProvider";
import Logo from "./Logo";

type Mode = "choose" | "create" | "join";

const slide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25 },
};

export default function PairingScreen() {
  const { pair } = useRoom();
  const [mode, setMode] = useState<Mode>("choose");
  const [created, setCreated] = useState<StoredRoom | null>(null);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const back = () => { setMode("choose"); setError(null); setCreated(null); setDigits(""); setBusy(false); };

  const handleCreate = async () => {
    setMode("create"); setBusy(true); setError(null);
    try { setCreated(await createRoom()); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const handleJoin = async () => {
    setBusy(true); setError(null);
    try { pair(await joinRoom(digits)); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); setBusy(false); }
  };

  const copy = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#fdf2f4] to-white px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-10 text-center">
        <div className="mx-auto mb-4 w-fit"><Logo size={80} /></div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">LestGo</h1>
        <p className="mt-1 text-sm text-zinc-500">Your shared bucket list, just for two.</p>
      </motion.div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {mode === "choose" && (
            <motion.div key="choose" {...slide} className="space-y-3">
              <button onClick={handleCreate} className="flex w-full items-center gap-4 rounded-2xl bg-brand p-4 text-left text-white shadow-md shadow-wine-700/30 transition active:scale-[0.98]">
                <Sparkles className="h-6 w-6" />
                <div><p className="font-semibold">Create Room</p><p className="text-xs text-white/80">Get a code to share with your partner</p></div>
              </button>
              <button onClick={() => setMode("join")} className="glass flex w-full items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[0.98]">
                <KeyRound className="h-6 w-6 text-wine-700" />
                <div><p className="font-semibold text-zinc-900">Join Room</p><p className="text-xs text-zinc-500">Enter the code your partner shared</p></div>
              </button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div key="create" {...slide} className="space-y-5 text-center">
              <button onClick={back} className="flex items-center gap-1 text-sm text-zinc-500"><ArrowLeft className="h-4 w-4" /> Back</button>
              {busy && <Loader2 className="mx-auto h-8 w-8 animate-spin text-wine-700" />}
              {created && (
                <>
                  <p className="text-sm text-zinc-500">Share this code with your partner</p>
                  <button onClick={copy} className="glass mx-auto flex items-center gap-3 rounded-2xl px-6 py-4">
                    <span className="font-mono text-3xl font-bold tracking-widest text-wine-700">{created.code}</span>
                    {copied ? <Check className="h-5 w-5 text-wine-700" /> : <Copy className="h-5 w-5 text-zinc-400" />}
                  </button>
                  <button onClick={() => pair(created)} className="w-full rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-md shadow-wine-700/30 transition active:scale-[0.98]">
                    Enter LestGo
                  </button>
                </>
              )}
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div key="join" {...slide} className="space-y-4">
              <button onClick={back} className="flex items-center gap-1 text-sm text-zinc-500"><ArrowLeft className="h-4 w-4" /> Back</button>
              <div className="glass flex items-center rounded-2xl px-4 focus-within:border-wine-600/50">
                <span className="font-mono text-xl font-semibold text-zinc-400">LGO-</span>
                <input
                  autoFocus inputMode="numeric" maxLength={4} value={digits}
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  className="w-full bg-transparent py-4 pl-1 font-mono text-xl font-semibold tracking-widest text-zinc-900 outline-none"
                />
              </div>
              <button disabled={busy || digits.length < 4} onClick={handleJoin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-md shadow-wine-700/30 transition active:scale-[0.98] disabled:opacity-40">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Join
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 text-center text-sm text-wine-600">{error}</p>}
      </div>
    </main>
  );
}
