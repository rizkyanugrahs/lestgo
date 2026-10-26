"use client";
import { useState } from "react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";

export type Place = { name: string; lat: number; lng: number };
type Hit = { display_name: string; lat: string; lon: string; name?: string };

const shorten = (s: string) => s.split(",").slice(0, 3).join(",").trim();

export default function LocationPicker({ value, onChange }: { value: Place | null; onChange: (p: Place | null) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setMsg(null); setHits([]);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=id&q=${encodeURIComponent(q.trim())}`);
      const data: Hit[] = await r.json();
      if (data.length === 0) setMsg("Tempat tidak ditemukan. Coba kata kunci lain.");
      setHits(data);
    } catch { setMsg("Gagal mencari lokasi. Cek internetmu."); }
    setBusy(false);
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { setMsg("Perangkat ini tidak mendukung GPS."); return; }
    setBusy(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude;
        let name = "Lokasi saat ini";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${lat}&lon=${lng}`);
          const d = await r.json();
          if (d.display_name) name = shorten(d.display_name);
        } catch { /* pakai nama bawaan */ }
        onChange({ name, lat, lng }); setHits([]); setBusy(false);
      },
      () => { setMsg("Izin lokasi ditolak. Aktifkan lokasi di pengaturan browser."); setBusy(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3">
        <MapPin className="h-5 w-5 shrink-0 text-violet-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{value.name}</p>
          <p className="text-[11px] text-zinc-500">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</p>
        </div>
        <button onClick={() => onChange(null)} aria-label="Hapus lokasi" className="rounded-full p-1 text-zinc-400"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-2xl border border-zinc-200 px-3 focus-within:border-violet-500">
          <Search className="h-4 w-4 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Cari nama tempat / alamat" className="w-full bg-transparent px-2 py-3 text-sm outline-none" />
        </div>
        <button onClick={search} className="rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white">Cari</button>
      </div>
      <button onClick={useMyLocation} className="flex items-center gap-2 text-sm font-medium text-violet-600">
        <Crosshair className="h-4 w-4" /> Pakai lokasi saya sekarang
      </button>
      {busy && <Loader2 className="h-5 w-5 animate-spin text-violet-600" />}
      {msg && <p className="text-sm text-zinc-500">{msg}</p>}
      {hits.length > 0 && (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
          {hits.map((h, i) => (
            <li key={i}>
              <button onClick={() => { onChange({ name: shorten(h.display_name), lat: parseFloat(h.lat), lng: parseFloat(h.lon) }); setHits([]); }}
                className="w-full px-4 py-2.5 text-left text-sm active:bg-violet-50">{shorten(h.display_name)}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
