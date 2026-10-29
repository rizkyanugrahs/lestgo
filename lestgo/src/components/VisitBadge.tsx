import { Repeat } from "lucide-react";

/** "Visited 3x" badge (only shown once a place has been visited more than once). */
export default function VisitBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count < 2) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white ${className}`}>
      <Repeat className="h-3 w-3" /> Visited {count}x
    </span>
  );
}
