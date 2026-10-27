'use client';
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, Search, X } from "lucide-react";
import { parseMapsLink } from "@/lib/geo";

export type Loc = { name: string; lat: number | null; lng: number | null; gmaps_url: string };
type Hit = { display_name: string; lat: string; lon: string };

const shorten = (s: string) => s.split(",").slice(0, 3).join(",").trim();

export default function LocationField({ value, onChange, autoDetect = false }: {
  value: Loc; onChange: (v: Loc) => void; autoDetect?: boolean;
}) {
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const latest = useRef(value);
  latest.current = value;

  const detect = (silent: boolean) => {
    if (!("geolocation" in navigator)) { if (!silent) setMsg("This device doesn't support GPS."); return; }
    setBusy(true); if (!silent) setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude;
        let name = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=${lat}&lon=${lng}`);
          const d = await r.json();
          if (d.display_name) name = shorten(d.display_name);
        } catch { /* the name can be typed manually */ }
        const cur = latest.current;
        onChange({ ...cur, lat, lng, name: cur.name.trim() ? cur.name : name || "Current location" });
        setBusy(false);
      },
      () => { if (!silent) setMsg("Location permission denied. Turn on location in your browser settings."); setBusy(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    if (autoDetect && value.lat === null) detect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setMsg(null); setHits([]);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(q.trim())}`);
      const data: Hit[] = await r.json();
      if (data.length === 0) setMsg("Place not found. Try other keywords.");
      setHits(data);
    } catch { setMsg("Couldn't search for locations. Check your connection."); }
    setBusy(false);
  };

  const onLink = (v: string) => {
    const c = parseMapsLink(v);
    onChange({ ...value, gmaps_url: v, ...(c ? { lat: c.lat, lng: c.lng } : {}) });
  };

  return (
    <div className="space-y-2">
      <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Location name / address (type manually)"
        className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-wine-600" />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSearching(!searching)}
          className="flex items-center gap-1.5 rounded-full bg-wine-700/10 px-3.5 py-2 text-xs font-semibold text-wine-700"><Search className="h-3.5 w-3.5" /> Search place</button>
        <button type="button" onClick={() => detect(false)}
          className="flex items-center gap-1.5 rounded-full bg-wine-700/10 px-3.5 py-2 text-xs font-semibold text-wine-700"><Crosshair className="h-3.5 w-3.5" /> Current location</button>
        {busy && <Loader2 className="h-5 w-5 animate-spin self-center text-wine-700" />}
      </div>

      {searching && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
              placeholder="e.g. Kopi Tuku Dago" className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
            <button type="button" onClick={search} className="rounded-2xl bg-brand px-4 text-sm font-semibold text-white">Search</button>
          </div>
          {hits.length > 0 && (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white/80">
              {hits.map((h, i) => (
                <li key={i}>
                  <button type="button" className="w-full px-4 py-2.5 text-left text-sm active:bg-wine-700/10"
                    onClick={() => { onChange({ ...value, name: shorten(h.display_name), lat: parseFloat(h.lat), lng: parseFloat(h.lon) }); setHits([]); setSearching(false); }}>
                    {shorten(h.display_name)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input value={value.gmaps_url} onChange={(e) => onLink(e.target.value)} inputMode="url"
        placeholder="Or paste a Google Maps link"
        className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-wine-600" />

      {value.lat !== null && value.lng !== null && (
        <div className="flex items-center justify-between rounded-2xl bg-wine-700/10 px-4 py-2 text-xs text-wine-700">
          <span>Coordinates saved ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})</span>
          <button type="button" onClick={() => onChange({ ...value, lat: null, lng: null })} aria-label="Clear coordinates"><X className="h-4 w-4" /></button>
        </div>
      )}
      {msg && <p className="text-xs text-zinc-500">{msg}</p>}
    </div>
  );
}