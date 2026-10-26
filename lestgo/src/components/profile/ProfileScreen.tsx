"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useData } from "../DataProvider";
import PlaceDetail from "../places/PlaceDetail";
import CoupleCard from "./CoupleCard";
import MoodCard from "./MoodCard";
import ComfortPicks from "./ComfortPicks";
import StatsCard from "./StatsCard";
import CalendarTimeline from "./CalendarTimeline";
import SettingsCard from "./SettingsCard";
import type { Place } from "@/lib/types";

export default function ProfileScreen() {
  const { places, refetch } = useData();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = (p: Place) => setOpenId(p.id);
  const opened = places.find((p) => p.id === openId) ?? null;

  return (
    <div className="space-y-6 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <CoupleCard />
      <MoodCard />
      <ComfortPicks onOpen={open} />
      <StatsCard />
      <CalendarTimeline onOpen={open} />
      <SettingsCard />
      <AnimatePresence>
        {opened && <PlaceDetail place={opened} onClose={() => setOpenId(null)} onChanged={refetch} />}
      </AnimatePresence>
    </div>
  );
}
