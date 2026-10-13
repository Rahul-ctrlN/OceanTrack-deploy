import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Ship,
  Clock3,
  Anchor,
  Wrench,
  Navigation,
  MapPin,
  Eye,
  Check,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api.js";

const STATUS_OPTIONS = [
  "Active",
  "At Port",
  "Maintenance",
  "In Transit",
  "Idle",
];

const VESSEL_TYPES = [
  "Container Ship",
  "Bulk Carrier",
  "Oil Tanker",
  "LNG Carrier",
  "Chemical Tanker",
  "Cargo Ship",
  "General Cargo",
  "Ro-Ro Ship",
  "Passenger Ship",
  "Tug",
  "Other",
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const emptyForm = {
  name: "",
  imoNumber: "",
  vesselType: "",
  flag: "",
  capacity: "",
  status: "Idle",
  location: "",
  latitude: "",
  longitude: "",
  speed: "",
  destination: "",
  locationPortId: "",
  locationUnlocode: "",
};

function getVesselLocation(vessel) {
  if (vessel.location?.trim()) {
    return vessel.location;
  }

  const hasCoords =
    vessel.latitude !== null &&
    vessel.latitude !== undefined &&
    vessel.latitude !== "" &&
    vessel.longitude !== null &&
    vessel.longitude !== undefined &&
    vessel.longitude !== "";

  if (hasCoords) {
    return `${Number(vessel.latitude).toFixed(4)}, ${Number(
      vessel.longitude
    ).toFixed(4)}`;
  }

  return "Location not set";
}

export default function Vessels() {
  const [vessels, setVessels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteVessel, setDeleteVessel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [selectedVessel, setSelectedVessel] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [portSearch, setPortSearch] = useState("");
  const [portResults, setPortResults] = useState([]);
  const [portLoading, setPortLoading] = useState(false);

  const [flagSearchOpen, setFlagSearchOpen] = useState(false);

  /* =====================================================
     FETCH VESSELS
  ===================================================== */

  const fetchVessels = async () => {
    try {
      setLoading(true);

      const res = await api.get("/vessels");

      setVessels(
        Array.isArray(res.data)
          ? res.data
          : res.data?.vessels || []
      );

      setError("");
    } catch (err) {
      console.error("Fetch vessels error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load vessels."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels();
  }, []);

  /* =====================================================
     PORT SEARCH
  ===================================================== */

  useEffect(() => {
    const query = portSearch.trim();

    if (!query || query.length < 2) {
      setPortResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setPortLoading(true);

        const res = await api.get(
          `/ports/search?q=${encodeURIComponent(query)}`
        );

        if (!cancelled) {
          setPortResults(
            Array.isArray(res.data)
              ? res.data
              : []
          );
        }
      } catch (err) {
        console.error("Port search error:", err);

        if (!cancelled) {
          setPortResults([]);
        }
      } finally {
        if (!cancelled) {
          setPortLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [portSearch]);

  /* =====================================================
     FILTER COUNTRIES
  ===================================================== */

  const filteredCountries = useMemo(() => {
    const query = form.flag.trim().toLowerCase();

    if (!query) {
      return COUNTRIES.slice(0, 12);
    }

    return COUNTRIES.filter((country) =>
      country.toLowerCase().includes(query)
    ).slice(0, 12);
  }, [form.flag]);

  /* =====================================================
     OPEN ADD
  ===================================================== */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setPortSearch("");
    setPortResults([]);

    setFlagSearchOpen(false);

    setFormError("");
    setModalOpen(true);
  };

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEditModal = (vessel) => {
    setEditingId(vessel._id);

    const flag = vessel.flag || "";

    setForm({
      name: vessel.name || "",
      imoNumber: vessel.imoNumber || "",
      vesselType: vessel.vesselType || "",
      flag,
      capacity: vessel.capacity ?? "",
      status: vessel.status || "Idle",
      location: vessel.location || "",
      latitude: vessel.latitude ?? "",
      longitude: vessel.longitude ?? "",
      speed: vessel.speed ?? "",
      destination: vessel.destination || "",
      locationPortId:
        vessel.locationPortId ||
        vessel.portId ||
        "",
      locationUnlocode:
        vessel.locationUnlocode ||
        vessel.unlocode ||
        "",
    });

    setPortSearch(vessel.location || "");
    setPortResults([]);

    setFlagSearchOpen(false);

    setFormError("");
    setModalOpen(true);
  };

  /* =====================================================
     SELECT COUNTRY
  ===================================================== */

  const selectCountry = (country) => {
    setForm((prev) => ({
      ...prev,
      flag: country,
    }));

    setFlagSearchOpen(false);
  };

  /* =====================================================
     SELECT PORT
  ===================================================== */

  const selectPort = (port) => {
    setForm((prev) => ({
      ...prev,
      location: port.mainPortName || "",
      latitude: port.latitude ?? "",
      longitude: port.longitude ?? "",
      locationPortId: port._id || "",
      locationUnlocode: port.unlocode || "",
    }));

    setPortSearch(port.mainPortName || "");
    setPortResults([]);
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    if (
      !form.name.trim() ||
      !form.imoNumber.trim() ||
      !form.vesselType ||
      !form.flag.trim()
    ) {
      return "Please fill all required vessel fields.";
    }

    const cleanImo = form.imoNumber
      .trim()
      .replace(/^IMO/i, "");

    if (!/^\d{7}$/.test(cleanImo)) {
      return "IMO number must contain exactly 7 digits.";
    }

    if (
      form.capacity !== "" &&
      Number(form.capacity) < 0
    ) {
      return "Capacity cannot be negative.";
    }

    if (
      form.speed !== "" &&
      Number(form.speed) < 0
    ) {
      return "Speed cannot be negative.";
    }

    if (
      form.status === "At Port" &&
      !form.location
    ) {
      return "Please select the current port.";
    }

    if (
      form.location &&
      (form.latitude === "" ||
        form.longitude === "")
    ) {
      return "Please select a valid WPI port from the list.";
    }

    return "";
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);

      const cleanImo = form.imoNumber
        .trim()
        .replace(/^IMO/i, "");

      const payload = {
        name: form.name.trim(),

        imoNumber: cleanImo,

        vesselType: form.vesselType,

        flag: form.flag.trim(),

        capacity:
          Number(form.capacity) || 0,

        status: form.status,

        location: form.location || "",

        latitude:
          form.latitude === ""
            ? null
            : Number(form.latitude),

        longitude:
          form.longitude === ""
            ? null
            : Number(form.longitude),

        speed:
          Number(form.speed) || 0,

        destination:
          form.destination.trim(),

        locationPortId:
          form.locationPortId || "",

        locationUnlocode:
          form.locationUnlocode || "",
      };

      if (editingId) {
        await api.put(
          `/vessels/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/vessels",
          payload
        );
      }

      setModalOpen(false);

      setForm({
        ...emptyForm,
      });

      await fetchVessels();
    } catch (err) {
      console.error("Save vessel error:", err);

      setFormError(
        err?.response?.data?.message ||
          "Failed to save vessel."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = (vessel) => {
    setDeleteError("");
    setDeleteVessel(vessel);
  };

  const confirmDeleteVessel = async () => {
    if (!deleteVessel?._id) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await api.delete(`/vessels/${deleteVessel._id}`);
      setDeleteVessel(null);
      await fetchVessels();
    } catch (err) {
      console.error("Delete vessel error:", err);
      setDeleteError(
        err?.response?.data?.message ||
          "Failed to delete vessel. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =====================================================
     VIEW
  ===================================================== */

  const openView = (vessel) => {
    setSelectedVessel(vessel);
    setViewOpen(true);
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredVessels = vessels.filter(
    (vessel) => {
      const query = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        !query ||
        vessel.name
          ?.toLowerCase()
          .includes(query) ||
        vessel.imoNumber
          ?.toLowerCase()
          .includes(query) ||
        vessel.vesselType
          ?.toLowerCase()
          .includes(query) ||
        vessel.location
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        vessel.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalVessels = vessels.length;

  const activeVessels =
    vessels.filter(
      (vessel) =>
        vessel.status === "Active"
    ).length;

  const atPortVessels =
    vessels.filter(
      (vessel) =>
        vessel.status === "At Port"
    ).length;

  const maintenanceVessels =
    vessels.filter(
      (vessel) =>
        vessel.status === "Maintenance"
    ).length;

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-600">

            <Ship size={18} />

            Fleet Operations

          </div>

          <h1 className="mt-2 text-3xl font-bold text-[#0F2742]">
            Vessels
          </h1>

          <p className="mt-1 text-slate-500">
            Manage your fleet vessels.
          </p>

        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Plus size={18} />
          Add Vessel
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          icon={<Ship size={21} />}
          title="Total Vessels"
          value={totalVessels}
          color="sky"
        />

        <SummaryCard
          icon={<Navigation size={21} />}
          title="Active"
          value={activeVessels}
          color="blue"
        />

        <SummaryCard
          icon={<Anchor size={21} />}
          title="At Port"
          value={atPortVessels}
          color="violet"
        />

        <SummaryCard
          icon={<Wrench size={21} />}
          title="Maintenance"
          value={maintenanceVessels}
          color="amber"
        />

      </div>

      {/* =================================================
          SEARCH / FILTER
      ================================================= */}

      <div className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search vessel, IMO number, type or location..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 lg:w-64"
          >

            <option value="">
              All Statuses
            </option>

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

      </div>

      {/* =================================================
          VESSEL RECORDS
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-[#D6E1EC] bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">

          <h2 className="text-lg font-bold text-[#0F2742]">
            Vessel Records
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {filteredVessels.length}{" "}
            vessel
            {filteredVessels.length === 1
              ? ""
              : "s"}{" "}
            displayed
          </p>

        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">

            <div className="text-center">

              <Clock3
                size={30}
                className="mx-auto animate-spin text-sky-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading vessels...
              </p>

            </div>

          </div>
        ) : filteredVessels.length === 0 ? (
          <div className="py-16 text-center">

            <Ship
              size={38}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-sm font-semibold text-slate-600">
              No vessels found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try changing your search or status filter.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    Vessel
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    IMO Number
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    Type
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    Location
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                    Speed
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredVessels.map(
                  (vessel) => (
                    <tr
                      key={vessel._id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                            <Ship size={19} />
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-slate-700">
                              {vessel.name ||
                                "Unnamed Vessel"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {vessel.flag ||
                                "Flag not set"}
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">

                        {vessel.imoNumber
                          ? `IMO ${String(
                              vessel.imoNumber
                            ).replace(
                              /^IMO/i,
                              ""
                            )}`
                          : "—"}

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {vessel.vesselType ||
                          "—"}
                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2">

                          <MapPin
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <div>

                            <p className="text-sm text-slate-600">
                              {getVesselLocation(vessel)}
                            </p>

                            {(vessel.locationUnlocode ||
                              vessel.unlocode) && (
                              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {vessel.locationUnlocode ||
                                  vessel.unlocode}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <StatusBadge
                          status={
                            vessel.status
                          }
                        />

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">

                        {vessel.speed !==
                          undefined &&
                        vessel.speed !== null &&
                        vessel.speed !== "" ? (
                          <>
                            {vessel.speed} knots
                          </>
                        ) : (
                          "—"
                        )}

                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              openView(
                                vessel
                              )
                            }
                            title="View"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                vessel
                              )
                            }
                            title="Edit"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(vessel)
                            }
                            title="Delete"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#0F2742]">
                  {editingId
                    ? "Edit Vessel"
                    : "Add Vessel"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Enter vessel information and select its current location.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              {/* VESSEL NAME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Vessel Name
                  <span className="text-rose-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter vessel name"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* IMO + TYPE */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    IMO Number
                    <span className="text-rose-500">
                      {" "}
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.imoNumber}
                    onChange={(event) =>
                      updateForm(
                        "imoNumber",
                        event.target.value
                      )
                    }
                    placeholder="1234567"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />

                  <p className="mt-1 text-[11px] text-slate-400">
                    Enter the 7-digit IMO number.
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Vessel Type
                    <span className="text-rose-500">
                      {" "}
                      *
                    </span>
                  </label>

                  <select
                    value={form.vesselType}
                    onChange={(event) =>
                      updateForm(
                        "vesselType",
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >

                    <option value="">
                      Select vessel type
                    </option>

                    {VESSEL_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* FLAG + CAPACITY */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* FLAG SEARCH */}

                <div className="relative">

                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Flag
                    <span className="text-rose-500">
                      {" "}
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={form.flag}
                      onFocus={() =>
                        setFlagSearchOpen(
                          true
                        )
                      }
                      onChange={(event) => {
                        updateForm(
                          "flag",
                          event.target.value
                        );
                        setFlagSearchOpen(
                          true
                        );
                      }}
                      placeholder="Search country..."
                      className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />

                  </div>

                  {flagSearchOpen &&
                    filteredCountries.length >
                      0 && (
                      <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">

                        {filteredCountries.map(
                          (country) => (
                            <button
                              type="button"
                              key={country}
                              onClick={() =>
                                selectCountry(
                                  country
                                )
                              }
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-sky-50"
                            >

                              <span>
                                {country}
                              </span>

                              {form.flag ===
                                country && (
                                <Check
                                  size={16}
                                  className="text-sky-600"
                                />
                              )}

                            </button>
                          )
                        )}

                      </div>
                    )}

                  <p className="mt-1 text-[11px] text-slate-400">
                    Search and select the vessel registration country.
                  </p>

                </div>

                {/* CAPACITY */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Capacity (tons)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.capacity}
                    onChange={(event) =>
                      updateForm(
                        "capacity",
                        event.target.value
                      )
                    }
                    placeholder="90000"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
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

              {/* CURRENT LOCATION */}

              <div className="relative">

                <label className="mb-2 block text-sm font-semibold text-slate-600">

                  Current Location

                  {form.status ===
                    "At Port" && (
                    <span className="text-rose-500">
                      {" "}
                      *
                    </span>
                  )}

                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={portSearch}
                    onChange={(event) => {
                      const value =
                        event.target
                          .value;

                      setPortSearch(value);

                      setForm((prev) => ({
                        ...prev,
                        location: value,
                        locationPortId: "",
                        locationUnlocode: "",
                      }));
                    }}
                    placeholder="Search WPI port..."
                    className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-12 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />

                  {portLoading && (
                    <Clock3
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sky-500"
                    />
                  )}

                </div>

                {/* PORT SEARCH RESULTS */}

                {portResults.length >
                  0 && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">

                    {portResults.map(
                      (port) => (
                        <button
                          type="button"
                          key={
                            port._id ||
                            port.wpinumber
                          }
                          onClick={() =>
                            selectPort(
                              port
                            )
                          }
                          className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-sky-50"
                        >

                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">

                            <Anchor size={16} />

                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-700">
                              {port.mainPortName}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-medium text-slate-400">

                              {port.countryCode && (
                                <span>
                                  {
                                    port.countryCode
                                  }
                                </span>
                              )}

                              {port.unlocode && (
                                <span>
                                  UN/LOCODE:{" "}
                                  {
                                    port.unlocode
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                        </button>
                      )
                    )}

                  </div>
                )}

                <p className="mt-1 text-[11px] text-slate-400">
                  Search and select a WPI port. Coordinates are filled automatically.
                </p>

              </div>

              {/* SPEED */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Speed (knots)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.speed}
                  onChange={(event) =>
                    updateForm(
                      "speed",
                      event.target.value
                    )
                  }
                  placeholder="23"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* DESTINATION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Destination
                </label>

                <input
                  type="text"
                  value={form.destination}
                  onChange={(event) =>
                    updateForm(
                      "destination",
                      event.target.value
                    )
                  }
                  placeholder="Optional destination"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 flex-1 rounded-xl bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Vessel"
                    : "Add Vessel"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {viewOpen &&
        selectedVessel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-[#0F2742]">
                    Vessel Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Fleet vessel information
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewOpen(false)
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={21} />
                </button>

              </div>

              <div className="space-y-4 p-6">

                <div className="flex items-center gap-4 rounded-2xl bg-sky-50 p-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                    <Ship size={24} />
                  </div>

                  <div>

                    <h3 className="font-bold text-slate-800">
                      {selectedVessel.name}
                    </h3>

                    <p className="text-xs text-slate-500">
                      {selectedVessel.imoNumber
                        ? `IMO ${String(
                            selectedVessel.imoNumber
                          ).replace(
                            /^IMO/i,
                            ""
                          )}`
                        : "No IMO number"}
                    </p>

                  </div>

                </div>

                <DetailItem
                  label="Vessel Type"
                  value={
                    selectedVessel.vesselType ||
                    "—"
                  }
                />

                <DetailItem
                  label="Flag"
                  value={
                    selectedVessel.flag ||
                    "—"
                  }
                />

                <DetailItem
                  label="Capacity"
                  value={
                    selectedVessel.capacity !==
                      undefined &&
                    selectedVessel.capacity !==
                      null
                      ? `${Number(
                          selectedVessel.capacity
                        ).toLocaleString(
                          "en-IN"
                        )} tons`
                      : "—"
                  }
                />

                <DetailItem
                  label="Status"
                  value={
                    selectedVessel.status ||
                    "—"
                  }
                />

                <DetailItem
                  label="Current Location"
                  value={getVesselLocation(selectedVessel)}
                />

                <DetailItem
                  label="UN/LOCODE"
                  value={
                    selectedVessel.locationUnlocode ||
                    selectedVessel.unlocode ||
                    "—"
                  }
                />

                <DetailItem
                  label="Speed"
                  value={
                    selectedVessel.speed !==
                      undefined &&
                    selectedVessel.speed !==
                      null
                      ? `${selectedVessel.speed} knots`
                      : "—"
                  }
                />

                <DetailItem
                  label="Destination"
                  value={
                    selectedVessel.destination ||
                    "—"
                  }
                />

              </div>

            </div>

          </div>
        )}

      {/* =================================================
          DELETE VESSEL CONFIRMATION
      ================================================= */}
      {deleteVessel && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteVessel(null);
              setDeleteError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-vessel-title"
            className="w-full max-w-xl overflow-hidden rounded-[22px] bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle size={27} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 id="delete-vessel-title" className="text-xl font-bold text-slate-800">
                      Delete Vessel?
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">Permanent action</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteVessel(null);
                    setDeleteError("");
                  }}
                  aria-label="Close delete confirmation"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              <p className="mt-7 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this vessel?
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Ship size={21} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Vessel</p>
                    <p className="truncate font-bold text-slate-800">
                      {deleteVessel.name || "Unnamed Vessel"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      IMO {String(deleteVessel.imoNumber || "—").replace(/^IMO/i, "").trim()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">Vessel Type</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{deleteVessel.vesselType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{deleteVessel.status || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current Location</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">{getVesselLocation(deleteVessel)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Flag</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{deleteVessel.flag || "—"}</p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-5 text-red-500">
                This vessel and its stored information will be permanently removed.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteVessel(null);
                  setDeleteError("");
                }}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteVessel}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Clock3 size={17} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete Vessel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  title,
  value,
  color,
}) {
  const colors = {
    sky: "bg-sky-50 text-sky-600",
    blue: "bg-blue-50 text-blue-600",
    violet:
      "bg-violet-50 text-violet-600",
    amber:
      "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-[#D6E1EC] bg-white p-5 shadow-sm">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          colors[color]
        }`}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold text-[#0F2742]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const value = status || "Unknown";

  const normalized = value.toLowerCase();

  let classes =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (
    normalized === "active" ||
    normalized === "in transit"
  ) {
    classes =
      "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized === "at port") {
    classes =
      "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (normalized === "maintenance") {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "idle") {
    classes =
      "border-slate-200 bg-slate-50 text-slate-600";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${classes}`}
    >
      {value}
    </span>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-sm font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}