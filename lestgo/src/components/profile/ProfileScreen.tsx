"use client";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Dices, Settings } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { useData } from "../DataProvider";
import PlaceDetail from "../places/PlaceDetail";
import CoupleCard from "./CoupleCard";
import StreakCard from "./StreakCard";
import ComfortPicks from "./ComfortPicks";
import StatsCard from "./StatsCard";
import CalendarTimeline from "./CalendarTimeline";
import SettingsSheet from "./SettingsSheet";
import GachaSheet from "./GachaSheet";
import type { Place } from "@/lib/types";

export default function ProfileScreen() {
  const { places, refetch } = useData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [gacha, setGacha] = useState(false);
  const open = useCallback((p: Place) => setOpenId(p.id), []);
  const opened = places.find((p) => p.id === openId) ?? null;

  return (
    <div className="space-y-5 px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <CoupleCard />
      <StreakCard />
      <ComfortPicks onOpen={open} />
      <StatsCard />
      <CalendarTimeline onOpen={open} />

      <div className="space-y-3 pb-2 pt-1">
        {/* Minimal spin trigger, sits right above Settings */}
        <div className="flex justify-center">
          <button onClick={() => setGacha(true)}
            className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 text-sm font-semibold text-wine-700 ring-1 ring-wine-700/15 transition active:scale-95">
            <Dices className="h-4 w-4" /> Spin random place
          </button>
        </div>
        <button onClick={() => setSettings(true)}
          className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-zinc-600 transition active:scale-[0.98]">
          <Settings className="h-4 w-4" /> Settings
        </button>
        <div className="text-center">
          <p className="text-xs text-zinc-400">Created by Kiky · Built for my girlfriend</p>
          <p className="mt-0.5 text-[11px] text-zinc-300">Version {APP_VERSION}</p>
        </div>
      </div>

      <AnimatePresence>
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
        {settings && <SettingsSheet onClose={() => setSettings(false)} />}
        {gacha && <GachaSheet onClose={() => setGacha(false)} onOpen={(p) => { setGacha(false); open(p); }} />}
      </AnimatePresence>
    </div>
  );
}
