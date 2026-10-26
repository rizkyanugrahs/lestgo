import { Utensils, Cookie, Heart, Plane, Clapperboard, Ticket, type LucideIcon } from "lucide-react";

export const CATEGORIES = ["Dining", "Snacks", "Date Ideas", "Travel", "Movies", "Events"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_STYLE: Record<string, { Icon: LucideIcon; bg: string; text: string }> = {
  Dining: { Icon: Utensils, bg: "bg-orange-100", text: "text-orange-600" },
  Snacks: { Icon: Cookie, bg: "bg-amber-100", text: "text-amber-600" },
  "Date Ideas": { Icon: Heart, bg: "bg-rose-100", text: "text-rose-600" },
  Travel: { Icon: Plane, bg: "bg-sky-100", text: "text-sky-600" },
  Movies: { Icon: Clapperboard, bg: "bg-indigo-100", text: "text-indigo-600" },
  Events: { Icon: Ticket, bg: "bg-emerald-100", text: "text-emerald-600" },
};

export const styleFor = (category: string) =>
  CATEGORY_STYLE[category] ?? { Icon: Heart, bg: "bg-violet-100", text: "text-violet-600" };
