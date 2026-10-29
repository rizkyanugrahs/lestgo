"use client";
import { motion, useReducedMotion } from "framer-motion";

const FLAME = "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";
const HEART = "M12 21s-7-4.6-9.5-9C.6 8.6 2.3 5 5.8 5c2 0 3.3 1 4.2 2.4C10.9 6 12.2 5 14.2 5c3.5 0 5.2 3.6 3.3 7-2.5 4.4-9.5 9-9.5 9z";

const COLORS = {
  1: { top: "#d4d4d8", mid: "#a1a1aa", bottom: "#71717a" },   // redup / abu-abu
  2: { top: "#CE0034", mid: "#A7002A", bottom: "#590016" },   // mulai menyala
  3: { top: "#FF7A8A", mid: "#CE0034", bottom: "#800020" },   // membara
} as const;

/** Hati berapi. level 1 = redup, 2 = menyala, 3 = membara dengan glow kuat. */
export default function FlamingHeart({ level }: { level: 1 | 2 | 3 }) {
  const reduce = useReducedMotion();
  const c = COLORS[level];
  const glow =
    level === 3 ? "drop-shadow(0 0 12px rgba(206,0,52,.95)) drop-shadow(0 0 28px rgba(206,0,52,.65))"
    : level === 2 ? "drop-shadow(0 0 8px rgba(167,0,42,.6))"
    : "none";

  return (
    <div className="relative h-24 w-24 shrink-0">
      {level === 3 && !reduce && (
        <motion.div className="absolute inset-0 rounded-full bg-wine-500/40 blur-2xl"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }} transition={{ duration: 1.6, repeat: Infinity }} />
      )}
      <motion.svg viewBox="0 0 24 24" className="relative h-full w-full" style={{ filter: glow, transformOrigin: "50% 90%" }}
        animate={reduce || level === 1 ? undefined : { scaleY: [1, 1.07, 0.97, 1.05, 1], scaleX: [1, 0.97, 1.02, 0.98, 1], rotate: [0, -1.5, 1.5, -1, 0] }}
        transition={{ duration: level === 3 ? 0.9 : 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <defs>
          <linearGradient id={`flame-${level}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={c.bottom} />
            <stop offset="55%" stopColor={c.mid} />
            <stop offset="100%" stopColor={c.top} />
          </linearGradient>
        </defs>
        <path d={FLAME} fill={`url(#flame-${level})`} />
        <g transform="translate(6.2 11.2) scale(0.5)">
          <path d={HEART} fill={level === 1 ? "#f4f4f5" : "#ffffff"} />
        </g>
      </motion.svg>
    </div>
  );
}
