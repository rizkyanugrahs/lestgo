"use client";
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
    if (!("geolocation" in navigator)) { if (!silent) setMsg("Perangkat ini tidak mendukung GPS."); return; }
    setBusy(true); if (!silent) setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude;
        let name = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${lat}&lon=${lng}`);
          const d = await r.json();
          if (d.display_name) name = shorten(d.display_name);
        } catch { /* nama diisi manual */ }
        const cur = latest.current;
        onChange({ ...cur, lat, lng, name: cur.name.trim() ? cur.name : name || "Lokasi saat ini" });
        setBusy(false);
      },
      () => { if (!silent) setMsg("Izin lokasi ditolak. Aktifkan lokasi di pengaturan browser."); setBusy(false); },
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
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=id&q=${encodeURIComponent(q.trim())}`);
      const data: Hit[] = await r.json();
      if (data.length === 0) setMsg("Tempat tidak ditemukan. Coba kata kunci lain.");
      setHits(data);
    } catch { setMsg("Gagal mencari lokasi. Cek internetmu."); }
    setBusy(false);
  };

  const onLink = (v: string) => {
    const c = parseMapsLink(v);
    onChange({ ...value, gmaps_url: v, ...(c ? { lat: c.lat, lng: c.lng } : {}) });
  };

  return (
    <div className="space-y-2">
      <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Nama lokasi / alamat (tulis manual)"
        className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-wine-600" />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSearching(!searching)}
          className="flex items-center gap-1.5 rounded-full bg-wine-700/10 px-3.5 py-2 text-xs font-semibold text-wine-700"><Search className="h-3.5 w-3.5" /> Cari tempat</button>
        <button type="button" onClick={() => detect(false)}
          className="flex items-center gap-1.5 rounded-full bg-wine-700/10 px-3.5 py-2 text-xs font-semibold text-wine-700"><Crosshair className="h-3.5 w-3.5" /> Lokasi saat ini</button>
        {busy && <Loader2 className="h-5 w-5 animate-spin self-center text-wine-700" />}
      </div>

      {searching && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
              placeholder="Mis. Kopi Tuku Dago" className="min-w-0 flex-1 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-wine-600" />
            <button type="button" onClick={search} className="rounded-2xl bg-brand px-4 text-sm font-semibold text-white">Cari</button>
          </div>
          {hits.length > 0 && (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
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
        placeholder="Atau tempel link Google Maps"
        className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-wine-600" />

      {value.lat !== null && value.lng !== null && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          <span>Koordinat tersimpan ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})</span>
          <button type="button" onClick={() => onChange({ ...value, lat: null, lng: null })} aria-label="Hapus koordinat"><X className="h-4 w-4" /></button>
        </div>
      )}
      {msg && <p className="text-xs text-zinc-500">{msg}</p>}
    </div>
  );
}
