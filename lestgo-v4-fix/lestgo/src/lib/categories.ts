import { Utensils, Cookie, Heart, Clapperboard, Plane, Sparkles, Tag, type LucideIcon } from "lucide-react";

export const DEFAULT_CATEGORIES = ["Dining", "Sweet Treats", "Date Ideas", "Cinema", "Travel", "Other"];

const ICONS: Record<string, LucideIcon> = {
  Dining: Utensils,
  "Sweet Treats": Cookie,
  "Date Ideas": Heart,
  Cinema: Clapperboard,
  Travel: Plane,
  Other: Sparkles,
};

/** Semua kategori memakai warna burgundy supaya tema tetap seragam. */
export const styleFor = (category: string) => ({
  Icon: ICONS[category] ?? Tag,
  bg: "bg-wine-700/10",
  text: "text-wine-700",
});
