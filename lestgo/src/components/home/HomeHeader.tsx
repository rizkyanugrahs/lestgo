"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useData } from "../DataProvider";

export default function HomeHeader() {
  const { roomInfo } = useData();
  return (
    <header className="flex items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <h1 className="text-2xl font-bold tracking-tight">LestGo</h1>
      <Link href="/profile" aria-label="Couple profile"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-brand shadow-md shadow-wine-700/20">
        {roomInfo.couple_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={roomInfo.couple_photo_url} alt="" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Heart className="h-4 w-4 fill-white text-white" />
        )}
      </Link>
    </header>
  );
}
