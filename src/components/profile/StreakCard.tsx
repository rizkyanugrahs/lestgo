"use client";
import { memo, useMemo } from "react";
import { placeVisitDates } from "@/lib/places";
import { todayStr } from "@/lib/dates";
import { useData } from "../DataProvider";
import FlamingHeart from "./FlamingHeart";

function StreakCard() {
  const { places } = useData();

  // Only counts the current month, so it resets by itself on the 1st of every month
  const count = useMemo(() => {
    const month = todayStr().slice(0, 7);
    return places.flatMap(placeVisitDates).filter((d) => d.startsWith(month)).length;
  }, [places]);

  // Level 1: 0-4 dates (dim gray) · Level 2: 5-9 (glowing burgundy) · Level 3: 10+ (intense bright fire)
  const level: 1 | 2 | 3 = count >= 10 ? 3 : count >= 5 ? 2 : 1;
  const desc =
    level === 3 ? "On fire! You two are blazing this month."
    : level === 2 ? `The flame is glowing. ${10 - count} more date${10 - count === 1 ? "" : "s"} to a full blaze.`
    : count === 0 ? "No dates this month yet. Let's light the flame!"
    : `${5 - count} more date${5 - count === 1 ? "" : "s"} to light the flame.`;

  return (
    <section className="glass flex items-center gap-4 rounded-3xl p-4">
      <FlamingHeart level={level} />
      <div className="min-w-0">
        <p className={`text-5xl font-extrabold leading-none ${level === 1 ? "text-zinc-400" : "bg-brand-bright bg-clip-text text-transparent"}`}>{count}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-700">{count === 1 ? "date" : "dates"} this month</p>
        <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      </div>
    </section>
  );
}

export default memo(StreakCard);
