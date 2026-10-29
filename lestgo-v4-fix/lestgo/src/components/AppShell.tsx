"use client";
import { useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useRoom } from "./RoomProvider";
import { DataProvider, useData } from "./DataProvider";
import { useMe } from "./MeProvider";
import PairingScreen from "./PairingScreen";
import IdentityPicker from "./IdentityPicker";
import BottomNav from "./BottomNav";
import PlaceFormModal from "./places/PlaceFormModal";
import { placeError } from "@/lib/places";

function Inner({ children }: { children: ReactNode }) {
  const [adding, setAdding] = useState(false);
  const { refetch, error } = useData();
  const { me, ready } = useMe();

  return (
    <>
      <div className="mx-auto min-h-dvh max-w-md pb-32">
        {error && (
          <div className="mx-5 mt-[calc(env(safe-area-inset-top)+0.75rem)] rounded-2xl bg-rose-50 p-3 text-xs text-rose-600">
            {placeError(error)}
          </div>
        )}
        {children}
      </div>
      <BottomNav onAdd={() => setAdding(true)} />
      <AnimatePresence>
        {adding && <PlaceFormModal mode="visited" onClose={() => setAdding(false)} onSaved={refetch} />}
      </AnimatePresence>
      {ready && !me && <IdentityPicker />}
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { room, ready } = useRoom();
  if (!ready) return <div className="min-h-dvh bg-[#fdf2f4]" />;
  if (!room) return <PairingScreen />;
  return (
    <DataProvider roomId={room.id}>
      <Inner>{children}</Inner>
    </DataProvider>
  );
}
