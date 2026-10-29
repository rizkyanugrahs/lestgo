"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PersonKey } from "@/lib/types";

const KEY = "lestgo_me";
export const ME_LABEL: Record<PersonKey, string> = { kiky: "Kiky", safina: "Safina" };

type Ctx = { me: PersonKey | null; ready: boolean; setMe: (p: PersonKey) => void };
const MeContext = createContext<Ctx | null>(null);

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMeState] = useState<PersonKey | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "kiky" || v === "safina") setMeState(v);
    } catch { /* abaikan */ }
    setReady(true);
  }, []);

  const setMe = (p: PersonKey) => {
    try { localStorage.setItem(KEY, p); } catch { /* abaikan */ }
    setMeState(p);
  };

  return <MeContext.Provider value={{ me, ready, setMe }}>{children}</MeContext.Provider>;
}

export const useMe = () => {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe must be used inside MeProvider");
  return ctx;
};
