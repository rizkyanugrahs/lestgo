"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Delete, Radio } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/lib/i18n";
import { friendlyError, pinToCredentials } from "@/lib/supabase";
import ConfigNotice from "@/components/ConfigNotice";
import Notice from "@/components/Notice";

export default function LoginPage() {
  const { user, loading, configured, supabase } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState("in"); // "in" atau "new"
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [step, setStep] = useState(1); // untuk mode baru: 1 = ketik, 2 = ulangi
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const current = mode === "new" && step === 2 ? pin2 : pin;
  const setCurrent = (v) => (mode === "new" && step === 2 ? setPin2(v) : setPin(v));

  function press(d) {
    if (busy) return;
    setError("");
    if (current.length < 6) setCurrent(current + d);
  }
  function backspace() {
    if (busy) return;
    setError("");
    setCurrent(current.slice(0, -1));
  }

  useEffect(() => {
    if (current.length === 6 && !busy) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  async function submit() {
    if (!supabase) return;
    if (mode === "new" && step === 1) {
      setStep(2);
      return;
    }
    if (mode === "new" && pin !== pin2) {
      setError(t("login_pin_mismatch"));
      setPin2("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const creds = pinToCredentials(pin);
      if (mode === "in") {
        const { error: e } = await supabase.auth.signInWithPassword(creds);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.auth.signUp(creds);
        if (e) throw e;
        if (data && !data.session) {
          const res = await supabase.auth.signInWithPassword(creds);
          if (res.error) throw res.error;
        }
      }
      router.replace("/");
    } catch (e) {
      setError(friendlyError(e));
      setPin("");
      setPin2("");
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const { error: e } = await supabase.auth.signInAnonymously();
      if (e) throw e;
      router.replace("/");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(m) {
    setMode(m); setPin(""); setPin2(""); setStep(1); setError("");
  }

  if (!configured) return <ConfigNotice />;

  const subtitle = mode === "new" ? (step === 1 ? t("login_create") : t("login_pin_confirm")) : t("login_sub");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center px-6 py-8">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl glass">
        <Radio size={26} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("login_title")}</h1>
      <p className="mt-1 text-sm text-zinc-400">{t("tagline")}</p>

      <p className="mt-8 text-sm text-zinc-300">{subtitle}</p>
      <div className="mt-4 flex gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={"h-3 w-3 rounded-full border border-white/30 transition " + (i < current.length ? "bg-white" : "bg-transparent")} />
        ))}
      </div>

      <div className="mt-3 min-h-[3rem] w-full">
        <Notice>{error}</Notice>
      </div>

      <div className="mt-2 grid w-full grid-cols-3 gap-3">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)} className="glass h-14 rounded-2xl text-xl font-medium active:scale-95">{k}</button>
        ))}
        <span />
        <button onClick={() => press("0")} className="glass h-14 rounded-2xl text-xl font-medium active:scale-95">0</button>
        <button onClick={backspace} aria-label="Hapus" className="glass flex h-14 items-center justify-center rounded-2xl active:scale-95">
          {busy ? <Loader2 className="animate-spin" size={20} /> : <Delete size={20} />}
        </button>
      </div>

      <div className="mt-6 flex w-full flex-col items-center gap-3">
        {mode === "in" ? (
          <button onClick={() => switchMode("new")} className="text-sm text-zinc-300 underline underline-offset-4">{t("login_mode_new")}</button>
        ) : (
          <button onClick={() => switchMode("in")} className="text-sm text-zinc-300 underline underline-offset-4">{t("login_mode_in")}</button>
        )}
        <div className="flex w-full items-center gap-3 text-xs text-zinc-500">
          <span className="h-px flex-1 bg-white/10" />{t("login_or")}<span className="h-px flex-1 bg-white/10" />
        </div>
        <button onClick={guest} disabled={busy} className="w-full rounded-2xl border border-white/10 py-3 text-sm text-white disabled:opacity-50">{t("login_guest")}</button>
        <div className="mt-1 flex gap-2 text-xs">
          <button onClick={() => setLang("en")} className={lang === "en" ? "text-white" : "text-zinc-500"}>EN</button>
          <span className="text-zinc-700">|</span>
          <button onClick={() => setLang("id")} className={lang === "id" ? "text-white" : "text-zinc-500"}>ID</button>
        </div>
      </div>
    </main>
  );
}
