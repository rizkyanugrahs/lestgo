"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { daysAgoStr } from "@/lib/dates";
import { useData } from "../DataProvider";

export default function MoodCard() {
  const { places } = useData();
  const reduce = useReducedMotion();

  const count = useMemo(() => {
    const cutoff = daysAgoStr(6); // 7 hari terakhir termasuk hari ini
    return places.filter((p) => p.status === "visited" && p.visited_date && p.visited_date >= cutoff).length;
  }, [places]);

  const happy = count >= 1;

  return (
    <section className={`flex items-center gap-4 rounded-3xl p-5 ${happy ? "bg-amber-50" : "bg-sky-50"}`}>
      <motion.div
        key={happy ? "happy" : "sad"}
        className="select-none text-6xl"
        animate={reduce ? undefined : happy ? { y: [0, -12, 0], rotate: [0, -8, 8, 0] } : { y: [0, 5, 0], rotate: [0, -4, 0] }}
        transition={{ duration: happy ? 1.4 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {happy ? "🥰" : "😢"}
      </motion.div>
      <div>
        <p className="text-sm font-medium text-zinc-500">Mood minggu ini</p>
        <p className="font-bold">{happy ? "Happy!" : "Sedih nih..."}</p>
        <p className="text-sm text-zinc-600">
          {happy ? `Minggu ini kalian sudah kencan ${count} kali.` : "Seminggu terakhir belum ada kencan. Yuk jalan berdua!"}
        </p>
      </div>
    </section>
  );
}
