'use client';
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { useData } from "../DataProvider";
import PlaceDetail from "../places/PlaceDetail";
import CoupleCard from "./CoupleCard";
import StreakCard from "./StreakCard";
import ComfortPicks from "./ComfortPicks";
import StatsCard from "./StatsCard";
import CalendarTimeline from "./CalendarTimeline";
import SettingsSheet from "./SettingsSheet";
import type { Place } from "@/lib/types";

export default function ProfileScreen() {
  const { places, refetch } = useData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const open = (p: Place) => setOpenId(p.id);
  const opened = places.find((p) => p.id === openId) ?? null;

  return (
    <div className="space-y-5 px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <CoupleCard />
      <StreakCard />
      <ComfortPicks onOpen={open} />
      <StatsCard />
      <CalendarTimeline onOpen={open} />

      <div className="flex justify-center pb-2 pt-1">
        <button onClick={() => setSettings(true)} aria-label="Settings"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition active:scale-95">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
        {settings && <SettingsSheet onClose={() => setSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}