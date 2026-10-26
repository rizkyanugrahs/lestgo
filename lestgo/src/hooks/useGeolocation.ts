"use client";
import { useEffect, useState } from "react";
import type { Coords } from "@/lib/geo";

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) { setError("Geolocation not supported"); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setError(null); },
      (e) => setError(e.message),
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 15_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { coords, error };
}
