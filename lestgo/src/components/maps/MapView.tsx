"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { Coords } from "@/lib/geo";
import type { Pin } from "./types";

export type Focus = { lat: number; lng: number; n: number };

const icon = (kind: Pin["kind"], selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="lg-pin ${kind === "wish" ? "lg-purple" : "lg-green"}${selected ? " sel" : ""}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 36],
  });

function Controller({ focus, boundsPts }: { focus: Focus | null; boundsPts: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [focus, map]);

  useEffect(() => {
    if (fitted.current || boundsPts.length === 0) return;
    fitted.current = true;
    if (boundsPts.length === 1) map.setView(boundsPts[0], 14);
    else map.fitBounds(boundsPts, { paddingTopLeft: [40, 110], paddingBottomRight: [40, 260], maxZoom: 15 });
  }, [boundsPts, map]);

  return null;
}

export default function MapView({ pins, selectedId, onSelect, user, focus, boundsPts }: {
  pins: Pin[]; selectedId: string | null; onSelect: (id: string) => void;
  user: Coords | null; focus: Focus | null; boundsPts: [number, number][];
}) {
  return (
    <MapContainer center={[-2.5, 118]} zoom={5} zoomControl={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <Controller focus={focus} boundsPts={boundsPts} />
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icon(p.kind, p.id === selectedId)}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
      {user && (
        <CircleMarker center={[user.lat, user.lng]} radius={8}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} />
      )}
    </MapContainer>
  );
}
