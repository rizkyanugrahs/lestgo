import { Utensils, Cookie, Heart, Clapperboard, Plane, Sparkles, Tag, MapPinned, type LucideIcon } from "lucide-react";

export const DEFAULT_CATEGORIES = ["Dining", "Sweet Treats", "Date Ideas", "Cinema", "Travel", "Other"];

/** Built-in category for spots close to home that you can visit again and again. Always comes last. */
export const NEARBY = "Nearby";
export const DEFAULT_NEARBY_CATEGORIES = ["Kopi", "Makan Berat", "Snack"];

const ICONS: Record<string, LucideIcon> = {
  Dining: Utensils,
  "Sweet Treats": Cookie,
  "Date Ideas": Heart,
  Cinema: Clapperboard,
  Travel: Plane,
  Other: Sparkles,
  [NEARBY]: MapPinned,
};

/** Semua kategori memakai warna burgundy supaya tema tetap seragam. */
export const styleFor = (category: string) => ({
  Icon: ICONS[category] ?? Tag,
  bg: "bg-wine-700/10",
  text: "text-wine-700",
});
