"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearStoredRoom, getStoredRoom, storeRoom, type StoredRoom } from "@/lib/room";

type Ctx = { room: StoredRoom | null; ready: boolean; pair: (r: StoredRoom) => void; unpair: () => void };
const RoomContext = createContext<Ctx | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<StoredRoom | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setRoom(getStoredRoom()); setReady(true); }, []);

  const pair = (r: StoredRoom) => { storeRoom(r); setRoom(r); };
  const unpair = () => { clearStoredRoom(); setRoom(null); };

  return <RoomContext.Provider value={{ room, ready, pair, unpair }}>{children}</RoomContext.Provider>;
}

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
};

export const useRoomId = () => useRoom().room!.id;
