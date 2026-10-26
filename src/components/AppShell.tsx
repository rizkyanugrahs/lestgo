"use client";
import type { ReactNode } from "react";
import { useRoom } from "./RoomProvider";
import PairingScreen from "./PairingScreen";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  const { room, ready } = useRoom();
  if (!ready) return <div className="min-h-dvh bg-violet-50" />;
  if (!room) return <PairingScreen />;
  return (
    <>
      <div className="mx-auto min-h-dvh max-w-md pb-32">{children}</div>
      <BottomNav />
    </>
  );
}
