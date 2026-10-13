import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon paths (common Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function FleetMap({ vessels = [] }) {
  // Only plot vessels with valid, non-zero coordinates
  const validVessels = (vessels || []).filter(
    (v) =>
      typeof v.latitude === "number" &&
      typeof v.longitude === "number" &&
      !(v.latitude === 0 && v.longitude === 0)
  );

  const defaultCenter = [20, 70];
  const center =
    validVessels.length > 0
      ? [validVessels[0].latitude, validVessels[0].longitude]
      : defaultCenter;

  if (validVessels.length === 0) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">
        No vessel location data available yet.
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={3} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validVessels.map((vessel) => (
        <Marker key={vessel._id} position={[vessel.latitude, vessel.longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{vessel.name}</p>
              <p>Status: {vessel.status || "Unknown"}</p>
              <p>Speed: {vessel.speed ?? 0} knots</p>
              <p>Destination: {vessel.destination || "N/A"}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}