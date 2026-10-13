import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Navigation,
  Ship,
  MapPin,
  Anchor,
  Activity,
  X,
  LocateFixed,
  ChevronRight,
  CircleAlert,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Wrench,
  Gauge,
  Compass,
} from "lucide-react";
import api from "../services/api";

const SHIP_IMAGE =
  "https://images.emojiterra.com/google/noto-emoji/unicode-17.0/color/svg/1f6a2.svg";

const ROUTE_COLORS = [
  "#0284C7",
  "#16A34A",
  "#EA580C",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#CA8A04",
  "#DC2626",
];

const statusColors = {
  "In Transit": "#0284C7",
  Active: "#0284C7",
  "At Port": "#16A34A",
  Maintenance: "#EA580C",
  Idle: "#64748B",
  Planned: "#7C3AED",
  Completed: "#16A34A",
  Delayed: "#DC2626",
  Cancelled: "#64748B",
};

function validNumber(value) {
  return value !== null && value !== "" && Number.isFinite(Number(value));
}

function getLat(vessel) {
  return vessel?.latitude ?? vessel?.lat;
}

function getLng(vessel) {
  return vessel?.longitude ?? vessel?.lng ?? vessel?.long;
}

function getDestinationLat(vessel, voyage) {
  return (
    voyage?.destinationPort?.latitude ??
    voyage?.destinationLatitude ??
    voyage?.destinationLat ??
    vessel?.destinationLatitude ??
    vessel?.destinationLat
  );
}

function getDestinationLng(vessel, voyage) {
  return (
    voyage?.destinationPort?.longitude ??
    voyage?.destinationLongitude ??
    voyage?.destinationLng ??
    vessel?.destinationLongitude ??
    vessel?.destinationLng ??
    vessel?.destinationLong
  );
}

function getVesselName(vessel) {
  return vessel?.name || vessel?.vesselName || "Unknown Vessel";
}

function getStatus(vessel) {
  return vessel?.status || "Unknown";
}

function getVoyageId(voyage) {
  return voyage?.voyageId || voyage?.voyageNumber || voyage?._id || "N/A";
}

function getVoyageForVessel(vessel, voyages) {
  if (!vessel || !Array.isArray(voyages)) return null;

  return (
    voyages.find((v) => {
      const vesselId =
        typeof v.vessel === "object" ? v.vessel?._id : v.vessel;

      return (
        String(vesselId || "") === String(vessel._id || "") ||
        String(v.vessel?._id || "") === String(vessel.id || "")
      );
    }) || null
  );
}

function createCurvedRoute(start, end, curve = 0.012) {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  const points = [];
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const length = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  const perpLat = -dLng / length;
  const perpLng = dLat / length;
  const bend = Math.min(length * curve, 0.8);

  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const ease = Math.sin(Math.PI * t);

    const lat = lat1 + dLat * t + perpLat * bend * ease;
    const lng = lng1 + dLng * t + perpLng * bend * ease;

    points.push([lat, lng]);
  }

  return points;
}

function createShipIcon() {
  return L.divIcon({
    className: "ocean-ship-marker",
    html: `
      <img
        src="${SHIP_IMAGE}"
        alt="Ship"
        style="width:32px;height:32px;object-fit:contain;display:block;"
      />
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    zIndexOffset: 1000,
  });
}

function AnchorIcon({ size = 28, color = "#8B5CF6" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5.5" r="2" />
      <line x1="12" y1="7.5" x2="12" y2="18.5" />
      <path d="M 4.5 11.5 A 7.5 7.5 0 0 0 19.5 11.5" />
      <line x1="4.5" y1="11.5" x2="7" y2="11.5" />
      <line x1="19.5" y1="11.5" x2="17" y2="11.5" />
    </svg>
  );
}

function createAnchorSvg(color = "#8B5CF6", size = 28) {
  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${color}"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      style="display:block;filter:drop-shadow(0 2px 2px rgba(15,23,42,.35));"
    >
      <circle cx="12" cy="5.5" r="2"></circle>
      <line x1="12" y1="7.5" x2="12" y2="18.5"></line>
      <path d="M 4.5 11.5 A 7.5 7.5 0 0 0 19.5 11.5"></path>
      <line x1="4.5" y1="11.5" x2="7" y2="11.5"></line>
      <line x1="19.5" y1="11.5" x2="17" y2="11.5"></line>
    </svg>
  `;
}

function createDestinationIcon(color = "#8B5CF6") {
  return L.divIcon({
    className: "ocean-destination-marker",
    html: `
      <div style="
        width:34px;
        height:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        background:rgba(255,255,255,.9);
        box-shadow:0 2px 8px rgba(15,23,42,.25);
      ">
        ${createAnchorSvg(color, 27)}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
    zIndexOffset: 500,
  });
}

function useResolvedLocation(vessel, voyage) {
  const [locationName, setLocationName] = useState("Resolving location...");

  useEffect(() => {
    let active = true;

    const directPort =
      vessel?.currentPort?.name ||
      vessel?.port?.name ||
      vessel?.port ||
      vessel?.currentPort ||
      vessel?.location ||
      vessel?.currentLocation ||
      voyage?.currentPort?.name ||
      voyage?.currentPort;

    if (typeof directPort === "string" && directPort.trim() && !directPort.includes(",")) {
      setLocationName(directPort.trim());
      return;
    }

    const lat = Number(getLat(vessel));
    const lng = Number(getLng(vessel));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLocationName("Position unavailable");
      return;
    }

    setLocationName(`Fetching place (${lat.toFixed(2)}, ${lng.toFixed(2)})...`);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data && data.address) {
          const addr = data.address;
          const place =
            addr.port ||
            addr.harbour ||
            addr.city ||
            addr.town ||
            addr.county ||
            addr.state ||
            addr.country ||
            data.display_name.split(",")[0];
          
          const country = addr.country ? `, ${addr.country}` : "";
          setLocationName(`${place}${country}`);
        } else {
          setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
        }
      })
      .catch(() => {
        if (active) setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      });

    return () => {
      active = false;
    };
  }, [vessel, voyage]);

  return locationName;
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-[#D6E1EC] bg-white p-5 shadow-[0_12px_40px_rgba(15,39,66,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-[#0F2742] dark:text-white">
          {value}
        </p>
      </div>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

function VesselDetailSidebar({ vessel, voyage, onClose }) {
  const locationName = useResolvedLocation(vessel, voyage);
  const status = getStatus(vessel);
  const statusColor = statusColors[status] || "#0284C7";

  const lat = Number(getLat(vessel));
  const lng = Number(getLng(vessel));

  return (
    <div className="w-full lg:w-96 flex-shrink-0 border-l border-[#D6E1EC] bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-y-auto flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950">
              <img src={SHIP_IMAGE} alt="ship" className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2742] dark:text-white text-lg">
                {getVesselName(vessel)}
              </h3>
              <p className="text-xs text-slate-500">
                Voyage #{getVoyageId(voyage)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Current Status</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: statusColor }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {status}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Resolved Location</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {locationName}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Compass size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Coordinates</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                    {Number.isFinite(lat) && Number.isFinite(lng)
                      ? `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Gauge size={15} />
                <span className="text-[11px] font-semibold">Speed</span>
              </div>
              <p className="text-base font-bold text-[#0F2742] dark:text-white">
                {validNumber(vessel?.speed) ? `${vessel.speed} kn` : "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Activity size={15} />
                <span className="text-[11px] font-semibold">Heading</span>
              </div>
              <p className="text-base font-bold text-[#0F2742] dark:text-white">
                {validNumber(vessel?.heading) ? `${vessel.heading}°` : "N/A"}
              </p>
            </div>
          </div>

          {voyage && (
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Anchor size={15} className="text-sky-600" />
                  Voyage Details
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination Port:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {voyage?.destination || vessel?.destination || "N/A"}
                  </span>
                </div>
                {voyage?.eta && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ETA:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(voyage.eta).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Close Vessel Panel
      </button>
    </div>
  );
}

function FitBounds({ vessels, voyages }) {
  const map = useMap();

  useEffect(() => {
    if (!vessels.length) return;

    const points = [];

    vessels.forEach((vessel) => {
      const lat = Number(getLat(vessel));
      const lng = Number(getLng(vessel));

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        points.push([lat, lng]);
      }

      const voyage = getVoyageForVessel(vessel, voyages);
      const destinationLat = Number(getDestinationLat(vessel, voyage));
      const destinationLng = Number(getDestinationLng(vessel, voyage));

      if (Number.isFinite(destinationLat) && Number.isFinite(destinationLng)) {
        points.push([destinationLat, destinationLng]);
      }
    });

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 6, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 6, animate: true });
  }, [map, vessels, voyages]);

  return null;
}

function FlyToVessel({ vessel }) {
  const map = useMap();

  useEffect(() => {
    if (!vessel) return;

    const lat = Number(getLat(vessel));
    const lng = Number(getLng(vessel));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.flyTo([lat, lng], 7, { duration: 1.1 });
  }, [map, vessel]);

  return null;
}

function ZoomControls() {
  const map = useMap();

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="flex h-11 w-11 items-center justify-center border-b border-slate-200 text-slate-700 transition hover:bg-slate-50 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Plus size={22} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="flex h-11 w-11 items-center justify-center text-slate-700 transition hover:bg-slate-50 hover:text-sky-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Minus size={22} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function RecenterButton({ vessels, voyages }) {
  const map = useMap();

  const handleRecenter = () => {
    const points = [];

    vessels.forEach((vessel) => {
      const lat = Number(getLat(vessel));
      const lng = Number(getLng(vessel));

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        points.push([lat, lng]);
      }

      const voyage = getVoyageForVessel(vessel, voyages);

      const destinationLat = Number(
        getDestinationLat(vessel, voyage)
      );
      const destinationLng = Number(
        getDestinationLng(vessel, voyage)
      );

      if (
        Number.isFinite(destinationLat) &&
        Number.isFinite(destinationLng) &&
        destinationLat >= -90 &&
        destinationLat <= 90 &&
        destinationLng >= -180 &&
        destinationLng <= 180
      ) {
        points.push([destinationLat, destinationLng]);
      }
    });

    if (!points.length) return;

    if (points.length === 1) {
      map.flyTo(points[0], 6, {
        animate: true,
        duration: 0.8,
      });
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      paddingTopLeft: [80, 80],
      paddingBottomRight: [80, 80],
      maxZoom: 6,
      animate: true,
      duration: 0.8,
    });
  };

  return (
    <button
      type="button"
      onClick={handleRecenter}
      title="Center fleet"
      aria-label="Center fleet"
      className="
        absolute right-4 top-[106px] z-[1000]
        flex h-11 w-11 items-center justify-center
        rounded-xl border border-slate-200
        bg-white/95 text-slate-700 shadow-lg
        backdrop-blur transition
        hover:bg-white hover:text-sky-600
        active:scale-95
        focus:outline-none focus:ring-0
        dark:border-slate-700
        dark:bg-slate-900/95 dark:text-slate-200
        dark:hover:bg-slate-800
      "
    >
      <LocateFixed size={20} strokeWidth={2.2} />
    </button>
  );
}

function FullscreenButton() {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === map.getContainer());
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [map]);

  const toggleFullscreen = async () => {
    const container = map.getContainer();
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
    setTimeout(() => map.invalidateSize(), 150);
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
      className="absolute bottom-5 right-5 z-[1000] flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
    </button>
  );
}

function VesselMarker({ vessel, voyage, isSelected, onSelect }) {
  const locationName = useResolvedLocation(vessel, voyage);
  const lat = Number(getLat(vessel));
  const lng = Number(getLng(vessel));

  return (
    <Marker
      position={[lat, lng]}
      icon={createShipIcon()}
      zIndexOffset={1000}
      keyboard={false}
      eventHandlers={{
        click: () => onSelect(vessel),
      }}
    >
      <Popup>
        <div className="min-w-[220px]">
          <div className="mb-3 flex items-center gap-2">
            <img src={SHIP_IMAGE} alt="" className="h-8 w-8" />
            <div>
              <p className="font-bold text-slate-800">
                {getVesselName(vessel)}
              </p>
              <p className="text-xs text-slate-400">
                Voyage #{getVoyageId(voyage)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-slate-700">
                {getStatus(vessel)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-700 max-w-[130px] truncate text-right">
                {locationName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed:</span>
              <span className="font-semibold text-slate-700">
                {validNumber(vessel?.speed) ? `${vessel.speed} knots` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function Tracking() {
  const [vessels, setVessels] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mapRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [vesselRes, voyageRes] = await Promise.all([
        api.get("/vessels"),
        api.get("/voyages"),
      ]);

      const vesselData =
        vesselRes.data?.vessels || vesselRes.data?.data || vesselRes.data || [];
      const voyageData =
        voyageRes.data?.voyages || voyageRes.data?.data || voyageRes.data || [];

      setVessels(Array.isArray(vesselData) ? vesselData : []);
      setVoyages(Array.isArray(voyageData) ? voyageData : []);
    } catch (err) {
      console.error("Tracking load error:", err);
      setError(
        err?.response?.data?.message || "Unable to load vessel tracking data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const trackedVessels = useMemo(() => {
    return vessels.filter((vessel) => {
      const lat = Number(getLat(vessel));
      const lng = Number(getLng(vessel));

      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });
  }, [vessels]);

  const filteredVessels = useMemo(() => {
    return trackedVessels.filter((vessel) => {
      const name = getVesselName(vessel).toLowerCase();
      const status = getStatus(vessel);

      const matchesSearch = name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trackedVessels, search, statusFilter]);

  const stats = useMemo(() => {
    const getCount = (status) =>
      trackedVessels.filter((v) => getStatus(v) === status).length;

    return {
      total: trackedVessels.length,
      transit: getCount("In Transit") + getCount("Active"),
      port: getCount("At Port"),
      maintenance: getCount("Maintenance"),
      idle: getCount("Idle"),
    };
  }, [trackedVessels]);

  const statusOptions = useMemo(() => {
    const values = trackedVessels.map((v) => getStatus(v));
    return ["All", ...new Set(values)];
  }, [trackedVessels]);

  const getColor = (vessel) => {
    const index = trackedVessels.findIndex(
      (v) => String(v._id) === String(vessel._id)
    );
    return ROUTE_COLORS[index >= 0 ? index % ROUTE_COLORS.length : 0];
  };

  const handleSelect = (vessel) => {
    setSelectedVessel(vessel);
  };

  return (
    <>
      <style>{`
        .leaflet-marker-icon:focus,
        .leaflet-marker-icon:focus-visible,
        .ocean-ship-marker:focus,
        .ocean-ship-marker:focus-visible,
        .ocean-destination-marker:focus,
        .ocean-destination-marker:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        .ocean-ship-marker,
        .ocean-destination-marker {
          background: transparent !important;
          border: 0 !important;
        }

        .ocean-map-fullscreen:fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          border-radius: 0 !important;
        }
      `}</style>

      <div className="min-h-full bg-[#EEF3F8] dark:bg-slate-950 text-slate-900 dark:text-white p-6">
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
              <Navigation size={16} />
              Fleet Operations
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0F2742] dark:text-white">
              Fleet Tracking
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor real-time vessel locations, voyage routes, and status.
            </p>
          </div>

          <button
            onClick={loadData}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl border border-slate-200 bg-white
              px-4 py-2.5 text-sm font-semibold text-slate-700
              shadow-sm transition hover:border-sky-300 hover:text-sky-600
              dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
            "
          >
            <LocateFixed size={17} />
            Refresh Tracking
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
          <StatCard
            icon={<Ship size={19} />}
            title="Tracked Vessels"
            value={stats.total}
            color="#0284C7"
          />
          <StatCard
            icon={<Navigation size={19} />}
            title="In Transit"
            value={stats.transit}
            color="#16A34A"
          />
          <StatCard
            icon={<Anchor size={19} />}
            title="At Port"
            value={stats.port}
            color="#7C3AED"
          />
          <StatCard
            icon={<Wrench size={19} />}
            title="Maintenance"
            value={stats.maintenance}
            color="#EA580C"
          />
          <StatCard
            icon={<Activity size={19} />}
            title="Idle"
            value={stats.idle}
            color="#64748B"
          />
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert size={18} />
            {error}
          </div>
        )}

        {/* MAIN MAP CONTAINER */}
        <div
          className="
            overflow-hidden rounded-3xl border border-[#D6E1EC]
            bg-white shadow-[0_12px_40px_rgba(15,39,66,0.08)]
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          {/* MAP HEADER */}
          <div className="border-b border-[#D6E1EC] px-5 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950">
                  <MapPin size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-[#0F2742] dark:text-white">
                    Fleet Route Map
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any vessel or list entry to inspect full details in the side panel.
                  </p>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vessel..."
                    className="
                      h-10 w-full rounded-xl border border-slate-200
                      bg-slate-50 pl-9 pr-9 text-sm outline-none
                      transition focus:border-sky-400 focus:ring-2
                      focus:ring-sky-100 sm:w-56
                      dark:border-slate-700 dark:bg-slate-800
                      dark:text-white dark:focus:ring-sky-950
                    "
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="
                    h-10 rounded-xl border border-slate-200
                    bg-slate-50 px-3 text-sm font-medium text-slate-700
                    outline-none focus:border-sky-400
                    dark:border-slate-700 dark:bg-slate-800
                    dark:text-white
                  "
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Status" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SPLIT VIEW AREA: MAP & SIDEBAR */}
          <div className="flex flex-col lg:flex-row h-[620px]">
            {/* MAP AREA */}
            <div className="ocean-map-fullscreen relative flex-1 h-full">
              {loading ? (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
                    <p className="text-sm font-medium text-slate-500">
                      Loading fleet map...
                    </p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={[13.0827, 80.2707]}
                  zoom={5}
                  scrollWheelZoom={true}
                  zoomControl={false}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {!selectedVessel && (
                    <FitBounds vessels={filteredVessels} voyages={voyages} />
                  )}

                  <ZoomControls />
                  <RecenterButton
                    vessels={filteredVessels}
                    voyages={voyages}
                  />
                  <FullscreenButton />

                  {selectedVessel && <FlyToVessel vessel={selectedVessel} />}

                  {/* VESSEL MARKERS & ROUTES */}
                  {filteredVessels.map((vessel) => {
                    const lat = Number(getLat(vessel));
                    const lng = Number(getLng(vessel));
                    const voyage = getVoyageForVessel(vessel, voyages);

                    const destinationLat = Number(
                      getDestinationLat(vessel, voyage)
                    );
                    const destinationLng = Number(
                      getDestinationLng(vessel, voyage)
                    );

                    const hasDestination =
                      Number.isFinite(destinationLat) &&
                      Number.isFinite(destinationLng);

                    const color = getColor(vessel);
                    const isSelected =
                      selectedVessel &&
                      String(selectedVessel._id) === String(vessel._id);

                    const route = hasDestination
                      ? createCurvedRoute(
                          [lat, lng],
                          [destinationLat, destinationLng],
                          0.012
                        )
                      : null;

                    return (
                      <React.Fragment key={vessel._id}>
                        {route && (
                          <>
                            <Polyline
                              positions={route}
                              pathOptions={{
                                color,
                                weight: isSelected ? 4 : 2,
                                opacity: 1,
                                dashArray: "4 5",
                                lineCap: "butt",
                                lineJoin: "round",
                              }}
                            />
                            <Marker
                              position={[destinationLat, destinationLng]}
                              icon={createDestinationIcon(color)}
                              zIndexOffset={500}
                            >
                              <Popup>
                                <div className="min-w-[170px]">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Destination Port
                                  </p>
                                  <p className="mt-1 font-bold text-slate-800">
                                    {voyage?.destination ||
                                      vessel?.destination ||
                                      "Destination"}
                                  </p>
                                </div>
                              </Popup>
                            </Marker>
                          </>
                        )}

                        <VesselMarker
                          vessel={vessel}
                          voyage={voyage}
                          isSelected={isSelected}
                          onSelect={handleSelect}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              )}

              {/* MAP LEGEND OVERLAY */}
              {!loading && (
                <div className="absolute bottom-5 left-5 z-[500] flex items-center gap-4 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                  <div className="flex items-center gap-2">
                    <span className="h-0.5 w-6 border-t-2 border-dashed border-sky-600" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Planned Route
                    </span>
                  </div>

                  <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

                  <div className="flex items-center gap-2">
                    <AnchorIcon size={18} color="#8B5CF6" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Destination Port
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SIDE DETAIL BAR */}
            {selectedVessel && (
              <VesselDetailSidebar
                vessel={selectedVessel}
                voyage={getVoyageForVessel(selectedVessel, voyages)}
                onClose={() => setSelectedVessel(null)}
              />
            )}
          </div>
        </div>

        {/* BOTTOM FLEET LIST TABLE */}
        <div className="mt-6 space-y-6">
          <div
            className="
              overflow-hidden rounded-3xl border border-[#D6E1EC]
              bg-white shadow-[0_12px_40px_rgba(15,39,66,0.06)]
              dark:border-slate-800 dark:bg-slate-900
            "
          >
            <div className="border-b border-[#D6E1EC] px-5 py-4 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F2742] dark:text-white">
                  Fleet Vessels List
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select a vessel to focus position and view detail drawer.
                </p>
              </div>
              <Ship size={20} className="text-sky-600" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVessels.map((vessel) => {
                const voyage = getVoyageForVessel(vessel, voyages);
                const color = getColor(vessel);
                const active =
                  selectedVessel &&
                  String(selectedVessel._id) === String(vessel._id);

                return (
                  <button
                    key={vessel._id}
                    onClick={() => handleSelect(vessel)}
                    className={`
                      flex w-full items-center gap-4 px-5 py-4 text-left transition
                      ${
                        active
                          ? "bg-sky-50 dark:bg-sky-950/40"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }
                    `}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <img src={SHIP_IMAGE} alt="" className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-slate-800 dark:text-white">
                          {getVesselName(vessel)}
                        </p>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              statusColors[getStatus(vessel)] || color,
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Voyage #{getVoyageId(voyage)}
                      </p>
                    </div>

                    <div className="hidden sm:block text-right">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {getStatus(vessel)}
                      </span>
                    </div>

                    <ChevronRight size={18} className="text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}