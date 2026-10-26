"use client";
import { Star } from "lucide-react";

export default function Stars({ value, onChange, size = 20 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Star style={{ width: size, height: size }} className={n <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(value === n ? 0 : n)} aria-label={`${n} bintang`}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
