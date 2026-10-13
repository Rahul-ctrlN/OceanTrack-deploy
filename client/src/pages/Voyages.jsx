import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Route,
  Ship,
  CalendarDays,
  Fuel,
  Clock3,
  Eye,
} from "lucide-react";

import api from "../services/api.js";

/* =========================================================
   OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  "Planned",
  "In Progress",
  "Completed",
  "Delayed",
  "Cancelled",
];

const emptyForm = {
  voyageId: "",
  vessel: "",
  origin: "",
  destination: "",
  departureDate: "",
  expectedArrival: "",
  actualArrival: "",
  currentLocation: "",
  distance: "",
  status: "Planned",
  delay: "",
  plannedFuel: "",
  actualFuel: "",
  notes: "",
  progress: 0,
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getVesselName(vessel) {
  if (!vessel) return "-";

  if (typeof vessel === "string") return vessel;

  return (
    vessel.name ||
    vessel.vesselId ||
    vessel.imoNumber ||
    "-"
  );
}

function getVesselId(vessel) {
  if (!vessel) return "";

  if (typeof vessel === "string") return vessel;

  return vessel._id || vessel.id || "";
}

/* =========================================================
   STATUS STYLE
========================================================= */

function statusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "In Progress":
      return "bg-sky-50 text-sky-700 border-sky-200";

    case "Delayed":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getVoyageNumber(voyageId) {
  const match = String(voyageId || "").match(/(?:VOY-)?(\d+)$/i);
  return match ? match[1] : "";
}

function formatVoyageId(number) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  return `VOY-${digits.padStart(3, "0")}`;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Voyages() {
  const [voyages, setVoyages] = useState([]);
  const [vessels, setVessels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ADD / EDIT MODAL */

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [voyageNumber, setVoyageNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  /* DELETE MODAL */

  const [deleteVoyage, setDeleteVoyage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /* VIEW MODAL */

  const [viewVoyage, setViewVoyage] = useState(null);

  /* WPI PORT SEARCH */

  const [originPorts, setOriginPorts] = useState([]);
  const [destinationPorts, setDestinationPorts] = useState([]);
  const [currentLocationPorts, setCurrentLocationPorts] = useState([]);
  const [originSearching, setOriginSearching] = useState(false);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [currentLocationSearching, setCurrentLocationSearching] = useState(false);
  const portSearchTimers = useRef({
    origin: null,
    destination: null,
    currentLocation: null,
  });

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [voyageRes, vesselRes] = await Promise.all([
        api.get("/voyages"),
        api.get("/vessels"),
      ]);

      const voyageData =
        voyageRes.data?.voyages ||
        voyageRes.data?.data ||
        voyageRes.data ||
        [];

      const vesselData =
        vesselRes.data?.vessels ||
        vesselRes.data?.data ||
        vesselRes.data ||
        [];

      setVoyages(
        Array.isArray(voyageData) ? voyageData : []
      );

      setVessels(
        Array.isArray(vesselData) ? vesselData : []
      );

      setError("");
    } catch (err) {
      console.error("Voyage loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load voyages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =======================================================
     WPI PORT SEARCH
  ======================================================= */

  const searchPorts = async (value, type) => {
    const query = value.trim();

    if (!query) {
      if (type === "origin") {
        setOriginPorts([]);
      } else if (type === "destination") {
        setDestinationPorts([]);
      } else {
        setCurrentLocationPorts([]);
      }
      return;
    }

    try {
      if (type === "origin") {
        setOriginSearching(true);
      } else if (type === "destination") {
        setDestinationSearching(true);
      } else {
        setCurrentLocationSearching(true);
      }

      const res = await api.get(
        `/ports/search?q=${encodeURIComponent(query)}`
      );

      const results = Array.isArray(res.data)
        ? res.data
        : res.data?.ports || res.data?.data || [];

      if (type === "origin") {
        setOriginPorts(results);
      } else if (type === "destination") {
        setDestinationPorts(results);
      } else {
        setCurrentLocationPorts(results);
      }
    } catch (err) {
      console.error("Port search error:", err);

      if (type === "origin") {
        setOriginPorts([]);
      } else if (type === "destination") {
        setDestinationPorts([]);
      } else {
        setCurrentLocationPorts([]);
      }
    } finally {
      if (type === "origin") {
        setOriginSearching(false);
      } else if (type === "destination") {
        setDestinationSearching(false);
      } else {
        setCurrentLocationSearching(false);
      }
    }
  };

  const handlePortInput = (value, type) => {
    setForm((previous) => ({
      ...previous,
      [type]: value,
    }));

    if (portSearchTimers.current[type]) {
      clearTimeout(portSearchTimers.current[type]);
    }

    if (!value.trim()) {
      if (type === "origin") {
        setOriginPorts([]);
      } else if (type === "destination") {
        setDestinationPorts([]);
      } else {
        setCurrentLocationPorts([]);
      }
      return;
    }

    portSearchTimers.current[type] = setTimeout(() => {
      searchPorts(value, type);
    }, 300);
  };

  const selectPort = (port, type) => {
    const name = port?.mainPortName || port?.alternatePortName || "";

    setForm((previous) => ({
      ...previous,
      [type]: name,
    }));

    if (type === "origin") {
      setOriginPorts([]);
    } else if (type === "destination") {
      setDestinationPorts([]);
    } else {
      setCurrentLocationPorts([]);
    }
  };

  const clearPortSearch = () => {
    if (portSearchTimers.current.origin) {
      clearTimeout(portSearchTimers.current.origin);
    }

    if (portSearchTimers.current.destination) {
      clearTimeout(portSearchTimers.current.destination);
    }

    if (portSearchTimers.current.currentLocation) {
      clearTimeout(portSearchTimers.current.currentLocation);
    }

    setOriginPorts([]);
    setDestinationPorts([]);
    setCurrentLocationPorts([]);
    setOriginSearching(false);
    setDestinationSearching(false);
    setCurrentLocationSearching(false);
  };

  /* =======================================================
     FORM HANDLING
  ======================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    clearPortSearch();
    setEditingId(null);
    setForm(emptyForm);
    setVoyageNumber("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (voyage) => {
    clearPortSearch();
    setEditingId(voyage._id);
    setVoyageNumber(getVoyageNumber(voyage.voyageId));

    setForm({
      voyageId: voyage.voyageId || "",
      vessel: getVesselId(voyage.vessel),
      origin: voyage.origin || "",
      destination: voyage.destination || "",
      departureDate: voyage.departureDate
        ? String(voyage.departureDate).slice(0, 10)
        : "",
      expectedArrival: voyage.expectedArrival
        ? String(voyage.expectedArrival).slice(0, 10)
        : "",
      actualArrival: voyage.actualArrival
        ? String(voyage.actualArrival).slice(0, 10)
        : "",
      currentLocation: voyage.currentLocation || "",
      distance: voyage.distance ?? "",
      status: voyage.status || "Planned",
      delay: voyage.delay ?? "",
      plannedFuel: voyage.plannedFuel ?? "",
      actualFuel: voyage.actualFuel ?? "",
      notes: voyage.notes || "",
      progress: voyage.progress ?? 0,
    });

    setFormError("");
    setModalOpen(true);
  };

  /* =======================================================
     SAVE VOYAGE
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (
      !voyageNumber ||
      !form.vessel ||
      !form.origin ||
      !form.destination ||
      !form.departureDate ||
      !form.expectedArrival
    ) {
      setFormError(
        "Voyage ID, vessel, origin, destination, departure date and expected arrival are required."
      );

      return;
    }

    /* =====================================================
       DATE VALIDATION
       Departure must be on/before Expected Arrival.
       Actual Arrival cannot be before Departure.
    ===================================================== */

    const departure = new Date(`${form.departureDate}T00:00:00`);
    const expectedArrival = new Date(`${form.expectedArrival}T00:00:00`);
    const actualArrival = form.actualArrival
      ? new Date(`${form.actualArrival}T00:00:00`)
      : null;

    if (expectedArrival < departure) {
      setFormError(
        "Expected arrival cannot be before the departure date."
      );
      return;
    }

    if (actualArrival && actualArrival < departure) {
      setFormError(
        "Actual arrival cannot be before the departure date."
      );
      return;
    }

    /* =====================================================
       SAME-VESSEL VOYAGE OVERLAP CHECK
       A vessel cannot have two active/scheduled voyages
       whose date ranges overlap. Cancelled voyages are ignored.
    ===================================================== */

    const selectedVesselId = String(form.vessel);

    const hasOverlap = voyages.some((existing) => {
      if (existing._id === editingId) return false;
      if (existing.status === "Cancelled") return false;
      if (String(getVesselId(existing.vessel)) !== selectedVesselId) {
        return false;
      }

      if (!existing.departureDate || !existing.expectedArrival) {
        return false;
      }

      const existingStart = new Date(
        `${String(existing.departureDate).slice(0, 10)}T00:00:00`
      );
      const existingEnd = new Date(
        `${String(existing.expectedArrival).slice(0, 10)}T00:00:00`
      );

      return (
        existingStart <= expectedArrival &&
        existingEnd >= departure
      );
    });

    if (hasOverlap) {
      setFormError(
        "This vessel already has another voyage during the selected dates. Choose different dates or another vessel."
      );
      return;
    }

    const progressValue = Math.min(
      100,
      Math.max(0, Number(form.progress) || 0)
    );

    const formattedVoyageId = formatVoyageId(voyageNumber);

    const payload = {
      voyageId: formattedVoyageId,
      vessel: form.vessel,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departureDate: form.departureDate,
      expectedArrival: form.expectedArrival,
      actualArrival:
        form.actualArrival || undefined,
      currentLocation: form.currentLocation.trim(),
      distance: Number(form.distance) || 0,
      status: form.status,
      delay: Number(form.delay) || 0,
      plannedFuel: Number(form.plannedFuel) || 0,
      actualFuel: Number(form.actualFuel) || 0,
      notes: form.notes.trim(),
      progress: progressValue,
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(
          `/voyages/${editingId}`,
          payload
        );
      } else {
        await api.post("/voyages", payload);
      }

      clearPortSearch();
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setVoyageNumber("");

      await fetchData();
    } catch (err) {
      console.error("Save voyage error:", err);

      setFormError(
        err?.response?.data?.message ||
          "Failed to save voyage."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     OPEN DELETE POPUP
  ======================================================= */

  const openDeleteModal = (voyage) => {
    setDeleteError("");
    setDeleteVoyage(voyage);
  };

  /* =======================================================
     DELETE VOYAGE
  ======================================================= */

  const handleDelete = async () => {
    if (!deleteVoyage) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await api.delete(
        `/voyages/${deleteVoyage._id}`
      );

      setDeleteVoyage(null);

      await fetchData();
    } catch (err) {
      console.error("Delete voyage error:", err);

      setDeleteError(
        err?.response?.data?.message ||
          "Failed to delete voyage."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredVoyages = useMemo(() => {
    const query = search.toLowerCase().trim();

    const list = Array.isArray(voyages) ? voyages : [];

    return list.filter((voyage) => {
      const vesselName =
        getVesselName(voyage.vessel).toLowerCase();

      const matchesSearch =
        !query ||
        voyage.voyageId
          ?.toLowerCase()
          .includes(query) ||
        vesselName.includes(query) ||
        voyage.origin
          ?.toLowerCase()
          .includes(query) ||
        voyage.destination
          ?.toLowerCase()
          .includes(query) ||
        voyage.currentLocation
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        voyage.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [voyages, search, statusFilter]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    const list = Array.isArray(voyages) ? voyages : [];

    return {
      total: list.length,

      inProgress: list.filter(
        (v) => v.status === "In Progress"
      ).length,

      completed: list.filter(
        (v) => v.status === "Completed"
      ).length,

      delayed: list.filter(
        (v) => v.status === "Delayed"
      ).length,
    };
  }, [voyages]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Loading voyages...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Voyages
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage and monitor fleet voyages
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-red-500"
            />

            <div>
              <p className="font-semibold text-red-700">
                Unable to load voyages
              </p>

              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>

              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <div className="space-y-6">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 mb-1">
              <Route size={18} />

              <span className="text-xs font-semibold uppercase tracking-wider">
                Fleet Operations
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
              Voyages
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage routes, voyage progress and vessel journeys.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-black hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Add Voyage
          </button>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Route size={17} />

              <span className="text-xs font-medium">
                Total Voyages
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-800 mt-2">
              {summary.total}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock3 size={17} />

              <span className="text-xs font-medium">
                In Progress
              </span>
            </div>

            <p className="text-2xl font-bold text-sky-600 mt-2">
              {summary.inProgress}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarDays size={17} />

              <span className="text-xs font-medium">
                Completed
              </span>
            </div>

            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {summary.completed}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <AlertTriangle size={17} />

              <span className="text-xs font-medium">
                Delayed
              </span>
            </div>

            <p className="text-2xl font-bold text-amber-600 mt-2">
              {summary.delayed}
            </p>
          </div>
        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search voyage, vessel, origin or destination..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="md:w-52 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
            >
              <option value="">
                All Statuses
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                Voyage Records
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {filteredVoyages.length} voyage
                {filteredVoyages.length !== 1
                  ? "s"
                  : ""}{" "}
                displayed
              </p>
            </div>
          </div>

          {filteredVoyages.length === 0 ? (
            <div className="py-16 text-center">
              <Route
                size={38}
                className="mx-auto text-slate-300"
              />

              <p className="text-sm font-medium text-slate-500 mt-3">
                No voyages found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Voyage
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Vessel
                    </th>

                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500">
                      Route
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Departure
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Arrival
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>

                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">
                      Progress
                    </th>

                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredVoyages.map((voyage) => {
                    const progress = Math.min(
                      100,
                      Math.max(
                        0,
                        Number(voyage.progress) || 0
                      )
                    );

                    return (
                      <tr
                        key={voyage._id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        {/* VOYAGE */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {voyage.voyageId || "-"}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {voyage.currentLocation ||
                              "Location not updated"}
                          </p>
                        </td>

                        {/* VESSEL */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                              <Ship size={16} />
                            </div>

                            <span className="text-sm text-slate-700">
                              {getVesselName(
                                voyage.vessel
                              )}
                            </span>
                          </div>
                        </td>

                        {/* ROUTE */}

                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center justify-center text-sm text-center leading-5">
                            <p className="font-medium text-slate-700 max-w-[170px] truncate">
                              {voyage.origin || "-"}
                            </p>

                            <p className="text-xs text-slate-400 leading-none my-1">
                              ↓
                            </p>

                            <p className="font-medium text-slate-700 max-w-[170px] truncate">
                              {voyage.destination || "-"}
                            </p>
                          </div>
                        </td>

                        {/* DEPARTURE */}

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(
                              voyage.departureDate
                            )}
                          </p>
                        </td>

                        {/* ARRIVAL */}

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(
                              voyage.expectedArrival
                            )}
                          </p>

                          {voyage.delay > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              {voyage.delay} day
                              {voyage.delay !== 1
                                ? "s"
                                : ""}{" "}
                              delay
                            </p>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusStyle(
                              voyage.status
                            )}`}
                          >
                            {voyage.status ||
                              "Planned"}
                          </span>
                        </td>

                        {/* PROGRESS */}

                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">
                                Progress
                              </span>

                              <span className="text-xs font-semibold text-slate-700">
                                {progress}%
                              </span>
                            </div>

                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                setViewVoyage(voyage)
                              }
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="View voyage"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              onClick={() =>
                                openEditModal(voyage)
                              }
                              className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition"
                              title="Edit voyage"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() =>
                                openDeleteModal(voyage)
                              }
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                              title="Delete voyage"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              if (!saving) {
                clearPortSearch();
                setModalOpen(false);
              }
            }}
          />

          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingId
                    ? "Edit Voyage"
                    : "Add New Voyage"}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Enter voyage and route information.
                </p>
              </div>

              <button
                onClick={() =>
                  !saving && setModalOpen(false)
                }
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {formError}
                </div>
              )}

              {/* BASIC */}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Voyage ID *
                    </label>

                    <div className="flex h-[42px] overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                      <div className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                        VOY-
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={voyageNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setVoyageNumber(digits);
                        }}
                        placeholder="001"
                        className="min-w-0 flex-1 border-0 px-3 text-sm text-slate-700 outline-none focus:ring-0"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">
                      Enter numbers only. Example: 1 becomes VOY-001.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Vessel *
                    </label>

                    <select
                      name="vessel"
                      value={form.vessel}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    >
                      <option value="">
                        Select vessel
                      </option>

                      {vessels.map((vessel) => (
                        <option
                          key={vessel._id}
                          value={vessel._id}
                        >
                          {vessel.name ||
                            vessel.vesselId ||
                            vessel.imoNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ROUTE */}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Route
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Origin *
                    </label>

                    <input
                      name="origin"
                      value={form.origin}
                      onChange={(e) =>
                        handlePortInput(
                          e.target.value,
                          "origin"
                        )
                      }
                      placeholder="Search port name..."
                      autoComplete="off"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />

                    {originSearching && (
                      <div className="absolute right-3 top-[37px] text-xs text-slate-400">
                        Searching...
                      </div>
                    )}

                    {originPorts.length > 0 && (
                      <div className="absolute z-[120] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {originPorts.map((port, index) => (
                          <button
                            type="button"
                            key={
                              port._id ||
                              port.wpinumber ||
                              `${port.mainPortName}-${index}`
                            }
                            onClick={() =>
                              selectPort(
                                port,
                                "origin"
                              )
                            }
                            className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 last:border-b-0 transition"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {port.mainPortName ||
                                    port.alternatePortName ||
                                    "Unknown Port"}
                                </p>

                                <p className="text-xs text-slate-400 mt-0.5">
                                  {port.countryCode ||
                                    "Country not available"}
                                </p>
                              </div>

                              {port.unlocode && (
                                <span className="shrink-0 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                                  {port.unlocode}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {form.origin && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select a WPI port from the search results.
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Destination *
                    </label>

                    <input
                      name="destination"
                      value={form.destination}
                      onChange={(e) =>
                        handlePortInput(
                          e.target.value,
                          "destination"
                        )
                      }
                      placeholder="Search port name..."
                      autoComplete="off"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />

                    {destinationSearching && (
                      <div className="absolute right-3 top-[37px] text-xs text-slate-400">
                        Searching...
                      </div>
                    )}

                    {destinationPorts.length > 0 && (
                      <div className="absolute z-[120] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {destinationPorts.map((port, index) => (
                          <button
                            type="button"
                            key={
                              port._id ||
                              port.wpinumber ||
                              `${port.mainPortName}-${index}`
                            }
                            onClick={() =>
                              selectPort(
                                port,
                                "destination"
                              )
                            }
                            className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 last:border-b-0 transition"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {port.mainPortName ||
                                    port.alternatePortName ||
                                    "Unknown Port"}
                                </p>

                                <p className="text-xs text-slate-400 mt-0.5">
                                  {port.countryCode ||
                                    "Country not available"}
                                </p>
                              </div>

                              {port.unlocode && (
                                <span className="shrink-0 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                                  {port.unlocode}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {form.destination && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select a WPI port from the search results.
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Current Location
                    </label>

                    <input
                      name="currentLocation"
                      value={form.currentLocation}
                      onChange={(e) =>
                        handlePortInput(
                          e.target.value,
                          "currentLocation"
                        )
                      }
                      placeholder="Search current port..."
                      autoComplete="off"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />

                    {currentLocationSearching && (
                      <div className="absolute right-3 top-[37px] text-xs text-slate-400">
                        Searching...
                      </div>
                    )}

                    {currentLocationPorts.length > 0 && (
                      <div className="absolute z-[120] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {currentLocationPorts.map((port, index) => (
                          <button
                            type="button"
                            key={
                              port._id ||
                              port.wpinumber ||
                              `${port.mainPortName}-${index}`
                            }
                            onClick={() =>
                              selectPort(
                                port,
                                "currentLocation"
                              )
                            }
                            className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 last:border-b-0 transition"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {port.mainPortName ||
                                    port.alternatePortName ||
                                    "Unknown Port"}
                                </p>

                                <p className="text-xs text-slate-400 mt-0.5">
                                  {port.countryCode ||
                                    "Country not available"}
                                </p>
                              </div>

                              {port.unlocode && (
                                <span className="shrink-0 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                                  {port.unlocode}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {form.currentLocation && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Search and select a WPI port.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Distance
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="distance"
                      value={form.distance}
                      onChange={handleChange}
                      placeholder="2500"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* DATES */}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Departure *
                    </label>

                    <input
                      type="date"
                      name="departureDate"
                      value={form.departureDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Expected Arrival *
                    </label>

                    <input
                      type="date"
                      name="expectedArrival"
                      min={form.departureDate || undefined}
                      value={form.expectedArrival}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Actual Arrival
                    </label>

                    <input
                      type="date"
                      name="actualArrival"
                      min={form.departureDate || undefined}
                      value={form.actualArrival}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* STATUS */}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Voyage Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    >
                      {STATUS_OPTIONS.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Progress %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="progress"
                      value={form.progress}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Delay (days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="delay"
                      value={form.delay}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* FUEL */}

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Fuel
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Planned Fuel
                    </label>

                    <div className="relative">
                      <Fuel
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        min="0"
                        name="plannedFuel"
                        value={form.plannedFuel}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Actual Fuel
                    </label>

                    <div className="relative">
                      <Fuel
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        min="0"
                        name="actualFuel"
                        value={form.actualFuel}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NOTES */}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional voyage notes..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    clearPortSearch();
                    setModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Voyage"
                    : "Create Voyage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION POPUP
      ===================================================== */}

      {deleteVoyage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* DARK OVERLAY */}

          <div
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() =>
              !deleting && setDeleteVoyage(null)
            }
          />

          {/* POPUP */}

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* TOP */}

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Delete Voyage?
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      Permanent action
                    </p>
                  </div>
                </div>

                <button
                  disabled={deleting}
                  onClick={() =>
                    setDeleteVoyage(null)
                  }
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MESSAGE */}

              <div className="mt-6">
                <p className="text-sm text-slate-600 leading-6">
                  Are you sure you want to delete this
                  voyage?
                </p>

                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Route size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Voyage
                      </p>

                      <p className="text-sm font-bold text-slate-800">
                        {deleteVoyage.voyageId ||
                          "Unknown Voyage"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Origin
                      </p>

                      <p className="text-sm font-medium text-slate-700 mt-1">
                        {deleteVoyage.origin ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Destination
                      </p>

                      <p className="text-sm font-medium text-slate-700 mt-1">
                        {deleteVoyage.destination ||
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-red-500 mt-4">
                  This voyage and its stored information
                  will be permanently removed.
                </p>

                {deleteError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                    {deleteError}
                  </div>
                )}
              </div>
            </div>

            {/* BUTTONS */}

            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() =>
                  setDeleteVoyage(null)
                }
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60"
              >
                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete Voyage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW VOYAGE POPUP
      ===================================================== */}

      {viewVoyage && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setViewVoyage(null)}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            {/* HEADER */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                  Voyage Details
                </p>

                <h2 className="text-xl font-bold text-slate-800 mt-1">
                  {viewVoyage.voyageId}
                </h2>
              </div>

              <button
                onClick={() =>
                  setViewVoyage(null)
                }
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="p-6 space-y-5">
              {/* ROUTE */}

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-sky-600 flex items-center justify-center">
                    <Route size={20} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Route
                    </p>

                    <p className="font-bold text-slate-800">
                      {viewVoyage.origin} →{" "}
                      {viewVoyage.destination}
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Vessel
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {getVesselName(
                      viewVoyage.vessel
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Current Location
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {viewVoyage.currentLocation ||
                      "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Departure
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {formatDate(
                      viewVoyage.departureDate
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Expected Arrival
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {formatDate(
                      viewVoyage.expectedArrival
                    )}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Distance
                  </p>

                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {viewVoyage.distance || 0} km
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <span
                    className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-xs font-medium ${statusStyle(
                      viewVoyage.status
                    )}`}
                  >
                    {viewVoyage.status}
                  </span>
                </div>
              </div>

              {/* PROGRESS */}

              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Voyage Progress
                  </p>

                  <p className="text-sm font-bold text-sky-600">
                    {viewVoyage.progress || 0}%
                  </p>
                </div>

                <div className="h-3 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            viewVoyage.progress
                          ) || 0
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* FUEL */}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Fuel size={17} />

                    <span className="text-xs font-semibold">
                      Planned Fuel
                    </span>
                  </div>

                  <p className="text-xl font-bold text-slate-800 mt-2">
                    {viewVoyage.plannedFuel ||
                      0}
                  </p>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sky-600">
                    <Fuel size={17} />

                    <span className="text-xs font-semibold">
                      Actual Fuel
                    </span>
                  </div>

                  <p className="text-xl font-bold text-slate-800 mt-2">
                    {viewVoyage.actualFuel || 0}
                  </p>
                </div>
              </div>

              {/* NOTES */}

              {viewVoyage.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Notes
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-6">
                    {viewVoyage.notes}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() =>
                  setViewVoyage(null)
                }
                className="px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}