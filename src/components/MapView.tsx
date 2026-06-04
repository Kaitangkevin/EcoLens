import L from "leaflet";
import { Flame, MapPin } from "lucide-react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { AnalysisResponse } from "../lib/types";

const userIcon = L.divIcon({
  className: "ecolens-user-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const fireIcon = L.divIcon({
  className: "ecolens-fire-marker",
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  map.setView([latitude, longitude], map.getZoom());
  return null;
}

export function MapView({ result }: { result: AnalysisResponse }) {
  const center: [number, number] = [result.location.latitude, result.location.longitude];

  return (
    <section id="map" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-ink">Map</h2>
          <p className="mt-1 text-sm text-slate-600">User position, 50km radius, and NASA FIRMS detections.</p>
        </div>
        <div className="hidden items-center gap-4 text-sm text-slate-600 sm:flex">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-canopy" /> Location
          </span>
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-ember" /> Fire
          </span>
        </div>
      </div>

      <div className="h-[460px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
          <Recenter latitude={center[0]} longitude={center[1]} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={center}
            radius={50000}
            pathOptions={{ color: "#176b5b", fillColor: "#176b5b", fillOpacity: 0.08, weight: 2 }}
          />
          <Marker position={center} icon={userIcon}>
            <Popup>{result.location.label}</Popup>
          </Marker>
          {result.fires.fires.map((fire) => (
            <Marker
              key={`${fire.latitude}-${fire.longitude}-${fire.acquired_at}`}
              position={[fire.latitude, fire.longitude]}
              icon={fireIcon}
            >
              <Popup>
                <strong>Active fire detection</strong>
                <br />
                {fire.distance_km} km away
                <br />
                Confidence: {fire.confidence ?? "n/a"}
                <br />
                FRP: {fire.frp ?? "n/a"}
                <br />
                {fire.acquired_at ?? "Latest available"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
