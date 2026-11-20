"use client";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { parseMapsLink, placeNameFromMapsLink } from "@/lib/geo";

export type Loc = { name: string; lat: number | null; lng: number | null; gmaps_url: string };
type Hit = { display_name: string; lat: string; lon: string };

const shorten = (s: string) => s.split(",").slice(0, 3).join(",").trim();
const isMapsLink = (t: string) =>
  /^https?:\/\//i.test(t) && /(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.)/i.test(t);

/**
 * One smart location input:
 *  - type a place or address (autocomplete suggestions appear),
 *  - or paste a Google Maps link (name, coordinates and link are picked up automatically),
 *  - the small target icon inside the field uses your current location.
 */
export default function LocationField({ value, onChange, autoDetect = false }: {
  value: Loc; onChange: (v: Loc) => void; autoDetect?: boolean;
}) {
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const latest = useRef(value);
  latest.current = value;
  // The name the pinned location belongs to. Typing a different name un-pins it.
  const pinned = useRef<string | null>(value.lat !== null || value.gmaps_url ? value.name : null);
  // Don't search for text that was filled in by a selection / link / GPS
  const skipSearch = useRef(true);

  const handleLink = (link: string, typedName: string) => {
    const c = parseMapsLink(link);
    const name = placeNameFromMapsLink(link) || typedName || "Google Maps location";
    pinned.current = name;
    skipSearch.current = true;
    onChange({ name, lat: c ? c.lat : null, lng: c ? c.lng : null, gmaps_url: link });
    setHits([]); setOpen(false);
    setMsg(c ? null : "Link saved. It will be used for directions.");
  };

  const onType = (text: string) => {
    const m = text.match(/https?:\/\/\S+/i);
    if (m && isMapsLink(m[0])) { handleLink(m[0], text.replace(m[0], "").trim()); return; }
    if (pinned.current !== null && text !== pinned.current) {
      // a different place now: forget the old pin so it can't point to the wrong spot
      pinned.current = null;
      onChange({ name: text, lat: null, lng: null, gmaps_url: "" });
    } else {
      onChange({ ...latest.current, name: text });
    }
    skipSearch.current = false;
    setMsg(null);
  };

  // Autocomplete (debounced)
  useEffect(() => {
    const q = value.name.trim();
    if (skipSearch.current || q.length < 3 || isMapsLink(q)) { setHits([]); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal }
        );
        const data: Hit[] = await r.json();
        setHits(data); setOpen(true);
      } catch { /* aborted or offline: ignore */ }
      setBusy(false);
    }, 450);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [value.name]);

  const choose = (h: Hit) => {
    const name = shorten(h.display_name);
    pinned.current = name;
    skipSearch.current = true;
    onChange({ name, lat: parseFloat(h.lat), lng: parseFloat(h.lon), gmaps_url: "" });
    setHits([]); setOpen(false); setMsg(null);
  };

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
        const finalName = cur.name.trim() ? cur.name : name || "Current location";
        pinned.current = finalName;
        skipSearch.current = true;
        onChange({ ...cur, name: finalName, lat, lng });
        setHits([]); setOpen(false);
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

  const clearPin = () => {
    pinned.current = null;
    onChange({ ...value, lat: null, lng: null, gmaps_url: "" });
  };

  const pinnedNow = value.lat !== null || !!value.gmaps_url;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input value={value.name} onChange={(e) => onType(e.target.value)}
          onFocus={() => { if (hits.length) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type a place or address, or paste a Google Maps link"
          className="w-full rounded-2xl border border-zinc-200 bg-white/70 py-3 pl-10 pr-12 text-sm outline-none focus:border-wine-600" />
        <button type="button" onClick={() => detect(false)} aria-label="Use current location"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-wine-700/10 text-wine-700 transition active:scale-90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </button>

        {open && hits.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl">
            {hits.map((h, i) => (
              <li key={i}>
                <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => choose(h)}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm active:bg-wine-700/10">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-wine-700" />
                  <span className="line-clamp-2">{shorten(h.display_name)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pinnedNow && (
        <div className="flex items-center justify-between rounded-2xl bg-wine-700/10 px-4 py-2 text-xs text-wine-700">
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {value.lat !== null ? "Location pinned" : "Maps link saved"}</span>
          <button type="button" onClick={clearPin} aria-label="Remove pinned location"><X className="h-4 w-4" /></button>
        </div>
      )}
      {msg && <p className="text-xs text-zinc-500">{msg}</p>}
    </div>
  );
}
