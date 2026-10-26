"use client";
import { Heart } from "lucide-react";
import { useRoom } from "../RoomProvider";

export default function HomeHeader() {
  const { room } = useRoom();
  return (
    <header className="flex items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600">
          <Heart className="h-4 w-4 fill-white text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">LestGo</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-violet-600">{room?.code}</span>
        <div className="flex -space-x-2">
          <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-violet-400 to-fuchsia-400" />
          <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-rose-400 to-orange-300" />
        </div>
      </div>
    </header>
  );
}
