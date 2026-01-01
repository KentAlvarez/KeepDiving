"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import { useMemo } from "react";
import L from "leaflet";
import type { Site } from "@/lib/api";

// Fix íconos (Leaflet en bundlers suele “perder” las rutas por defecto)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ClickHandler(props: { onPick: (latlng: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      props.onPick(e.latlng);
    },
  });
  return null;
}

export default function SitesMap({
  sites,
  selected,
  onPick,
}: {
  sites: Site[];
  selected: { lat: number; lng: number };
  onPick: (lat: number, lng: number) => void;
}) {
  const center = useMemo<LatLngLiteral>(() => ({ lat: selected.lat, lng: selected.lng }), [selected.lat, selected.lng]);

  return (
    <MapContainer center={center} zoom={11} scrollWheelZoom className="rounded-2xl border">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler
        onPick={(p) => {
          onPick(p.lat, p.lng);
        }}
      />

      {/* Marker seleccionado (draft) */}
      <Marker position={center}>
        <Popup>
          <div className="text-sm">
            <b>Nuevo punto</b>
            <div>
              {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
            </div>
            <div className="text-xs text-gray-600">Click en el mapa para moverlo</div>
          </div>
        </Popup>
      </Marker>

      {/* Markers existentes */}
      {sites.map((s) => (
        <Marker key={s.id} position={{ lat: s.lat, lng: s.lng }}>
          <Popup>
            <div className="text-sm">
              <b>{s.name}</b>
              {s.description ? <div className="mt-1">{s.description}</div> : null}
              <div className="mt-1 text-xs text-gray-600">
                {s.lat.toFixed(6)}, {s.lng.toFixed(6)}
              </div>
              {s.difficulty ? <div className="mt-1 text-xs">Dificultad: {s.difficulty}</div> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}