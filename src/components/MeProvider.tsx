'use client';
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Heart } from "lucide-react";
import type { PersonKey } from "@/lib/types";

export const ME_LABEL: Record<PersonKey, string> = {
  kiky: "Kiky",
  safina: "Safina",
};

interface MeContextType {
  me: PersonKey | null;
  setMe: (person: PersonKey) => void;
}

const MeContext = createContext<MeContextType>({
  me: null,
  setMe: () => {},
});

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMeState] = useState<PersonKey | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lestgo_me") as PersonKey | null;
    if (saved === "kiky" || saved === "safina") {
      setMeState(saved);
    }
    setLoaded(true);
  }, []);

  const setMe = (person: PersonKey) => {
    setMeState(person);
    localStorage.setItem("lestgo_me", person);
  };

  if (!loaded) return null;

  if (!me) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-rose-50/50 via-white to-rose-50/30 p-6 backdrop-blur-md">
        <div className="w-full max-w-sm text-center">
          {/* Top Heart Badge with Burgundy Gradient */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#800020] via-[#a00028] to-[#580016] shadow-xl shadow-wine-900/30 ring-1 ring-white/20">
            <Heart className="h-8 w-8 fill-white text-white" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Who are you?</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Used to mark your Picks. You can change it in Settings.
          </p>

          <div className="mt-8 space-y-3">
            {(["kiky", "safina"] as PersonKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMe(key)}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white p-4 font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 transition active:scale-[0.98] hover:shadow-md hover:ring-wine-700/30"
              >
                {/* Person Icon with Burgundy Gradient Background */}
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#800020] to-[#a00028] text-white shadow-sm transition group-hover:scale-110">
                  <User className="h-4 w-4 stroke-[2.5]" />
                </div>
                <span className="text-base font-semibold">{ME_LABEL[key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MeContext.Provider value={{ me, setMe }}>
      {children}
    </MeContext.Provider>
  );
}

export const useMe = () => useContext(MeContext);