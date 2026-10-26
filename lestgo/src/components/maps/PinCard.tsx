"use client";
import { MapPin, Navigation, Star, X, CheckCircle2 } from "lucide-react";
import { directionsUrl, formatDistance } from "@/lib/geo";
import { fmtShort } from "@/lib/dates";
import type { Pin } from "./types";

export default function PinCard({ pin, km, onClick, onClose, className = "" }: {
  pin: Pin; km: number | null; onClick?: () => void; onClose?: () => void; className?: string;
}) {
  const visited = pin.kind === "visited";
  return (
    <div className={`relative flex gap-3 rounded-3xl bg-white p-3 shadow-xl shadow-violet-200/60 ring-1 ring-zinc-100 ${className}`}>
      <button onClick={onClick} className="flex min-w-0 flex-1 gap-3 text-left">
        <div className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl ${visited ? "bg-emerald-50" : "bg-violet-50"}`}>
          {pin.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pin.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {visited ? <CheckCircle2 className="h-7 w-7 text-emerald-300" /> : <MapPin className="h-7 w-7 text-violet-300" />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 pr-6 font-bold">{pin.title}</h3>
          {pin.subtitle && <p className="line-clamp-1 text-xs text-zinc-500">{pin.subtitle}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {visited ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                Dikunjungi{pin.date ? ` · ${fmtShort(pin.date)}` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Wishlist</span>
            )}
            {pin.rating && (
              <span className="flex items-center gap-0.5 text-zinc-600"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{pin.rating}</span>
            )}
            {km !== null && <span className="text-zinc-400">{formatDistance(km)}</span>}
          </div>
          <a href={directionsUrl(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white">
            <Navigation className="h-3 w-3" /> Get Directions
          </a>
        </div>
      </button>
      {onClose && (
        <button onClick={onClose} aria-label="Tutup" className="absolute right-2 top-2 rounded-full bg-zinc-100 p-1 text-zinc-500">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
