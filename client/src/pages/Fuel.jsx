import React, { useEffect, useMemo, useState } from "react";

import {

  Fuel as FuelIcon,

  Plus,

  Search,

  Eye,

  Pencil,

  Trash2,

  AlertTriangle,

  X,

  Droplets,

  Gauge,

  Route,

  TrendingDown,

  MapPin,

  CalendarDays,

  CircleDollarSign,

} from "lucide-react";

import { api } from "../services/api";



const emptyForm = {

  recordId: "",

  vessel: "",

  voyage: "",

  date: "",

  fuelType: "Marine Diesel",

  fuelUsed: "",

  costPerLiter: "",

  totalCost: "",

  remainingFuel: "",

  distance: "",

  consumptionRate: "",

  location: "",

  notes: "",

};



function getRecordDigits(value) {

  return String(value || "")

    .replace(/^FR-/i, "")

    .replace(/\D/g, "")

    .slice(0, 6);

}



function formatRecordId(value) {

  const digits = getRecordDigits(value);

  if (!digits) return "";

  return `FR-${digits.padStart(3, "0")}`;

}



function formatNumber(value) {

  return Number(value || 0).toLocaleString();

}



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



function getVesselName(record) {

  if (!record?.vessel) return "—";



  if (typeof record.vessel === "object") {

    return (

      record.vessel.name ||

      record.vessel.vesselId ||

      record.vessel._id ||

      "—"

    );

  }



  return record.vessel;

}



function getVoyageName(record, voyages = []) {

  if (!record?.voyage) return "—";



  if (typeof record.voyage === "object") {

    return (

      record.voyage.voyageId ||

      record.voyage.voyageNumber ||

      record.voyage._id ||

      "—"

    );

  }



  const voyage = voyages.find(

    (item) => String(item?._id || "") === String(record.voyage)

  );



  return (

    voyage?.voyageId ||

    voyage?.voyageNumber ||

    record.voyage ||

    "—"

  );

}



export default function Fuel() {

  const [records, setRecords] = useState([]);

  const [vessels, setVessels] = useState([]);

  const [voyages, setVoyages] = useState([]);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);



  const [search, setSearch] = useState("");

  const [fuelTypeFilter, setFuelTypeFilter] = useState("All");



  const [showModal, setShowModal] = useState(false);

  const [showView, setShowView] = useState(false);

  const [showDelete, setShowDelete] = useState(false);



  const [editingRecord, setEditingRecord] = useState(null);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [deletingRecord, setDeletingRecord] = useState(null);



  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");



  const [locationSearch, setLocationSearch] = useState("");

  const [locationResults, setLocationResults] = useState([]);

  const [locationSearching, setLocationSearching] = useState(false);



  const loadData = async () => {

    try {

      setLoading(true);



      const [fuelRes, vesselRes, voyageRes] = await Promise.all([

        api.get("/fuel"),

        api.get("/vessels"),

        api.get("/voyages"),

      ]);



      const fuelData =

        fuelRes.data?.fuel ||

        fuelRes.data?.records ||

        fuelRes.data?.data ||

        fuelRes.data ||

        [];



      const vesselData =

        vesselRes.data?.vessels ||

        vesselRes.data?.data ||

        vesselRes.data ||

        [];



      const voyageData =

        voyageRes.data?.voyages ||

        voyageRes.data?.data ||

        voyageRes.data ||

        [];



      setRecords(Array.isArray(fuelData) ? fuelData : []);

      setVessels(Array.isArray(vesselData) ? vesselData : []);

      setVoyages(Array.isArray(voyageData) ? voyageData : []);

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message || "Unable to load fuel records."

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    loadData();

  }, []);



  useEffect(() => {

    const query = locationSearch.trim();



    if (query.length < 2) {

      setLocationResults([]);

      setLocationSearching(false);

      return;

    }



    const timer = setTimeout(async () => {

      try {

        setLocationSearching(true);

        const res = await api.get(

          `/ports/search?q=${encodeURIComponent(query)}`

        );

        setLocationResults(Array.isArray(res.data) ? res.data : []);

      } catch (err) {

        console.error("Location search error:", err);

        setLocationResults([]);

      } finally {

        setLocationSearching(false);

      }

    }, 300);



    return () => clearTimeout(timer);

  }, [locationSearch]);



  const fuelTypes = useMemo(() => {

    return [

      "All",

      ...new Set(

        records

          .map((record) => record.fuelType)

          .filter(Boolean)

      ),

    ];

  }, [records]);



  const filteredRecords = useMemo(() => {

    const term = search.toLowerCase().trim();



    return records.filter((record) => {

      const matchesSearch =

        !term ||

        String(record.recordId || "").toLowerCase().includes(term) ||

        getVesselName(record).toLowerCase().includes(term) ||

        getVoyageName(record, voyages).toLowerCase().includes(term) ||

        String(record.location || "").toLowerCase().includes(term) ||

        String(record.fuelType || "").toLowerCase().includes(term);



      const matchesType =

        fuelTypeFilter === "All" ||

        record.fuelType === fuelTypeFilter;



      return matchesSearch && matchesType;

    });

  }, [records, search, fuelTypeFilter]);



  const totalFuelUsed = records.reduce(

    (sum, record) => sum + Number(record.fuelUsed ?? record.quantity ?? 0),

    0

  );



  const totalRemainingFuel = records.reduce(

    (sum, record) => sum + Number(record.remainingFuel ?? 0),

    0

  );



  const totalDistance = records.reduce(

    (sum, record) => sum + Number(record.distance ?? 0),

    0

  );



  const averageConsumption =

    totalDistance > 0 ? totalFuelUsed / totalDistance : 0;



  const totalFuelCost = records.reduce(

    (sum, record) =>

      sum +

      Number(

        record.totalCost ??

          record.cost ??

          (

            Number(record.fuelUsed ?? record.quantity ?? 0) *

            Number(record.costPerLiter || 0)

          )

      ),

    0

  );



  const openAddModal = () => {

    setEditingRecord(null);

    setForm({

      ...emptyForm,

      date: new Date().toISOString().split("T")[0],

    });

    setLocationSearch("");

    setLocationResults([]);

    setError("");

    setShowModal(true);

  };



  const openEditModal = (record) => {

    setEditingRecord(record);



    setForm({

      recordId: record.recordId || "",

      vessel:

        typeof record.vessel === "object"

          ? record.vessel._id || ""

          : record.vessel || "",

      voyage:

        typeof record.voyage === "object"

          ? record.voyage._id || ""

          : record.voyage || "",

      date: record.date

        ? new Date(record.date).toISOString().split("T")[0]

        : "",

      fuelType: record.fuelType || "Marine Diesel",

      fuelUsed: record.fuelUsed ?? "",

      costPerLiter: record.costPerLiter ?? "",

      totalCost:

        record.totalCost ??

        record.cost ??

        (

          Number(record.fuelUsed ?? record.quantity ?? 0) *

          Number(record.costPerLiter || 0)

        ),

      remainingFuel: record.remainingFuel ?? "",

      distance: record.distance ?? "",

      consumptionRate: record.consumptionRate ?? "",

      location: record.location || "",

      notes: record.notes || "",

    });



    setLocationSearch(record.location || "");

    setLocationResults([]);

    setError("");

    setShowModal(true);

  };



  const openViewModal = (record) => {

    setSelectedRecord(record);

    setShowView(true);

  };



  const openDeleteModal = (record) => {

    setDeletingRecord(record);

    setShowDelete(true);

  };



  const handleChange = (e) => {

    const { name, value } = e.target;



    setForm((prev) => {

      const updated = {

        ...prev,

        [name]: value,

      };



      if (

        name === "fuelUsed" ||

        name === "distance" ||

        name === "costPerLiter"

      ) {

        const fuel = Number(

          name === "fuelUsed" ? value : updated.fuelUsed

        );



        const distance = Number(

          name === "distance" ? value : updated.distance

        );



        const costPerLiter = Number(

          name === "costPerLiter"

            ? value

            : updated.costPerLiter

        );



        updated.consumptionRate =

          distance > 0

            ? (fuel / distance).toFixed(2)

            : "";



        updated.totalCost =

          fuel > 0 && costPerLiter > 0

            ? (fuel * costPerLiter).toFixed(2)

            : "";

      }



      return updated;

    });

  };



  const handleSubmit = async (e) => {

    e.preventDefault();



    if (!form.vessel || !form.date || !form.fuelUsed) {

      setError("Please fill in vessel, date and fuel used.");

      return;

    }



    if (Number(form.fuelUsed) < 0 || Number(form.remainingFuel) < 0) {

      setError("Fuel values cannot be negative.");

      return;

    }



    if (Number(form.distance) < 0) {

      setError("Distance cannot be negative.");

      return;

    }



    try {

      setSaving(true);

      setError("");



      const payload = {

        recordId: formatRecordId(form.recordId) || undefined,

        vessel: form.vessel,

        voyage: form.voyage || undefined,

        date: form.date,

        fuelType: form.fuelType,

        fuelUsed: Number(form.fuelUsed),

        costPerLiter: Number(form.costPerLiter || 0),

        totalCost:

          Number(form.fuelUsed || 0) *

          Number(form.costPerLiter || 0),

        cost:

          Number(form.fuelUsed || 0) *

          Number(form.costPerLiter || 0),

        remainingFuel: Number(form.remainingFuel || 0),

        distance: Number(form.distance || 0),

        consumptionRate:

          Number(form.distance) > 0

            ? Number(form.fuelUsed) / Number(form.distance)

            : 0,

        location: form.location,

        notes: form.notes,

      };



      if (editingRecord) {

        await api.put(`/fuel/${editingRecord._id}`, payload);

      } else {

        await api.post("/fuel", payload);

      }



      setShowModal(false);

      setEditingRecord(null);

      setForm(emptyForm);



      await loadData();

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

          "Unable to save the fuel record."

      );

    } finally {

      setSaving(false);

    }

  };



  const handleDelete = async () => {

    if (!deletingRecord) return;



    try {

      setSaving(true);



      await api.delete(`/fuel/${deletingRecord._id}`);



      setShowDelete(false);

      setDeletingRecord(null);



      await loadData();

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

          "Unable to delete the fuel record."

      );

      setShowDelete(false);

    } finally {

      setSaving(false);

    }

  };



  return (

    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">

      {/* Header */}

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-600">

            <FuelIcon size={17} />

            Fleet Operations

          </div>



          <h1 className="text-3xl font-bold tracking-tight text-slate-900">

            Fuel Management

          </h1>



          <p className="mt-1 text-sm text-slate-500">

            Track fuel usage, efficiency and vessel consumption.

          </p>

        </div>



        <button

          onClick={openAddModal}

          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700"

        >

          <Plus size={18} />

          Add Fuel Record

        </button>

      </div>



      {/* Stats */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard

          icon={<Droplets size={21} />}

          title="Fuel Used"

          value={`${formatNumber(totalFuelUsed)} L`}

          subtitle="Total recorded usage"

        />



        <StatCard

          icon={<FuelIcon size={21} />}

          title="Remaining Fuel"

          value={`${formatNumber(totalRemainingFuel)} L`}

          subtitle="Across recorded entries"

        />



        <StatCard

          icon={<Route size={21} />}

          title="Distance Covered"

          value={`${formatNumber(totalDistance)} km`}

          subtitle="Recorded distance"

        />



        <StatCard

          icon={<Gauge size={21} />}

          title="Avg. Consumption"

          value={`${averageConsumption.toFixed(2)} L/km`}

          subtitle="Fuel used per distance"

        />



        <StatCard

          icon={<CircleDollarSign size={21} />}

          title="Fuel Investment"

          value={`₹${formatNumber(totalFuelCost)}`}

          subtitle="Total recorded fuel cost"

        />

      </div>



      {/* Main Card */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Toolbar */}

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search

              size={18}

              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

            />



            <input

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search record, vessel, voyage or location..."

              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"

            />

          </div>



          <select

            value={fuelTypeFilter}

            onChange={(e) => setFuelTypeFilter(e.target.value)}

            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-400"

          >

            {fuelTypes.map((type) => (

              <option key={type} value={type}>

                {type === "All" ? "All Fuel Types" : type}

              </option>

            ))}

          </select>

        </div>



        {error && (

          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}



        {/* Table */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead>

              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">

                <th className="px-5 py-4">Record</th>

                <th className="px-5 py-4">Vessel</th>

                <th className="px-5 py-4">Voyage</th>

                <th className="px-5 py-4">Date</th>

                <th className="px-5 py-4">Fuel Type</th>

                <th className="px-5 py-4">Fuel Used</th>

                <th className="px-5 py-4">Remaining</th>

                <th className="px-5 py-4">Rate</th>

                <th className="px-5 py-4">Cost</th>

                <th className="px-5 py-4">Actions</th>

              </tr>

            </thead>



            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>

                  <td

                    colSpan="10"

                    className="px-5 py-14 text-center text-sm text-slate-500"

                  >

                    Loading fuel records...

                  </td>

                </tr>

              ) : filteredRecords.length === 0 ? (

                <tr>

                  <td

                    colSpan="10"

                    className="px-5 py-14 text-center"

                  >

                    <FuelIcon

                      size={35}

                      className="mx-auto mb-3 text-slate-300"

                    />

                    <p className="font-medium text-slate-600">

                      No fuel records found

                    </p>

                    <p className="mt-1 text-sm text-slate-400">

                      Try changing your search or filter.

                    </p>

                  </td>

                </tr>

              ) : (

                filteredRecords.map((record) => (

                  <tr

                    key={record._id}

                    className="transition hover:bg-slate-50"

                  >

                    <td className="px-5 py-4">

                      <span className="font-semibold text-slate-800">

                        {formatRecordId(record.recordId) || "—"}

                      </span>

                    </td>



                    <td className="px-5 py-4">

                      <div className="font-medium text-slate-800">

                        {getVesselName(record)}

                      </div>

                    </td>



                    <td className="px-5 py-4 text-sm text-slate-600">

                      {getVoyageName(record, voyages)}

                    </td>



                    <td className="px-5 py-4 text-sm text-slate-600">

                      {formatDate(record.date)}

                    </td>



                    <td className="px-5 py-4">

                      <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">

                        {record.fuelType || "—"}

                      </span>

                    </td>



                    <td className="px-5 py-4 font-semibold text-slate-800">

                      {formatNumber(record.fuelUsed)} L

                    </td>



                    <td className="px-5 py-4 text-sm text-slate-600">

                      {formatNumber(record.remainingFuel)} L

                    </td>



                    <td className="px-5 py-4">

                      <span className="font-semibold text-emerald-600">

                        {Number(record.consumptionRate || 0).toFixed(2)}

                      </span>

                      <span className="ml-1 text-xs text-slate-400">

                        L/km

                      </span>

                    </td>



                    <td className="px-5 py-4 font-semibold text-slate-800">

                      ₹{formatNumber(

                        record.totalCost ??

                        record.cost ??

                        (Number(record.fuelUsed || record.quantity || 0) *

                          Number(record.costPerLiter || 0))

                      )}

                    </td>



                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <ActionButton

                          title="View"

                          onClick={() => openViewModal(record)}

                        >

                          <Eye size={16} />

                        </ActionButton>



                        <ActionButton

                          title="Edit"

                          onClick={() => openEditModal(record)}

                        >

                          <Pencil size={16} />

                        </ActionButton>



                        <ActionButton

                          title="Delete"

                          danger

                          onClick={() => openDeleteModal(record)}

                        >

                          <Trash2 size={16} />

                        </ActionButton>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">

          Showing{" "}

          <span className="font-semibold text-slate-700">

            {filteredRecords.length}

          </span>{" "}

          of{" "}

          <span className="font-semibold text-slate-700">

            {records.length}

          </span>{" "}

          fuel records

        </div>

      </div>



      {/* Add/Edit Modal */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {editingRecord ? "Edit Fuel Record" : "Add Fuel Record"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  Enter fuel usage and vessel information.

                </p>

              </div>



              <button

                onClick={() => setShowModal(false)}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"

              >

                <X size={20} />

              </button>

            </div>



            <form onSubmit={handleSubmit} className="p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                    Record ID

                  </label>



                  <div className="flex h-[42px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">

                    <span className="flex items-center border-r border-slate-200 bg-slate-100 px-4 text-sm font-bold text-sky-700">

                      FR-

                    </span>



                    <input

                      type="text"

                      inputMode="numeric"

                      value={getRecordDigits(form.recordId)}

                      onChange={(e) =>

                        setForm((prev) => ({

                          ...prev,

                          recordId: getRecordDigits(e.target.value),

                        }))

                      }

                      placeholder="001"

                      className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-700 outline-none"

                    />

                  </div>



                  <p className="mt-1 text-[11px] text-slate-400">

                    Enter numbers only. Example: FR-001

                  </p>

                </div>



                <Select

                  label="Vessel"

                  name="vessel"

                  value={form.vessel}

                  onChange={handleChange}

                  required

                >

                  <option value="">Select vessel</option>

                  {vessels.map((vessel) => (

                    <option key={vessel._id} value={vessel._id}>

                      {vessel.name || vessel.vesselId}

                    </option>

                  ))}

                </Select>



                <Select

                  label="Voyage"

                  name="voyage"

                  value={form.voyage}

                  onChange={handleChange}

                >

                  <option value="">Select voyage</option>

                  {Array.isArray(voyages) && voyages.map((voyage) => (

                    <option key={voyage._id} value={voyage._id}>

                      {voyage.voyageId ||

                        voyage.voyageNumber ||

                        voyage._id}

                    </option>

                  ))}

                </Select>



                <Input

                  label="Date"

                  name="date"

                  type="date"

                  value={form.date}

                  onChange={handleChange}

                  required

                />



                <Select

                  label="Fuel Type"

                  name="fuelType"

                  value={form.fuelType}

                  onChange={handleChange}

                >

                  <option>Marine Diesel</option>

                  <option>Heavy Fuel Oil</option>

                  <option>Marine Gas Oil</option>

                  <option>Liquefied Natural Gas</option>

                  <option>Other</option>

                </Select>



                <Input

                  label="Fuel Used (L)"

                  name="fuelUsed"

                  type="number"

                  min="0"

                  value={form.fuelUsed}

                  onChange={handleChange}

                  required

                  placeholder="5000"

                />



                <Input

                  label="Cost per Liter (₹)"

                  name="costPerLiter"

                  type="number"

                  min="0"

                  step="0.01"

                  value={form.costPerLiter}

                  onChange={handleChange}

                  required

                  placeholder="80"

                />



                <Input

                  label="Fuel Investment (₹)"

                  name="totalCost"

                  value={

                    form.totalCost

                      ? `₹${Number(form.totalCost).toLocaleString("en-IN", {

                          maximumFractionDigits: 2,

                        })}`

                      : "₹0"

                  }

                  readOnly

                />



                <Input

                  label="Remaining Fuel (L)"

                  name="remainingFuel"

                  type="number"

                  min="0"

                  value={form.remainingFuel}

                  onChange={handleChange}

                  placeholder="25000"

                />



                <Input

                  label="Distance (km)"

                  name="distance"

                  type="number"

                  min="0"

                  value={form.distance}

                  onChange={handleChange}

                  placeholder="850"

                />



                <Input

                  label="Consumption Rate (L/km)"

                  name="consumptionRate"

                  value={form.consumptionRate}

                  readOnly

                  placeholder="Auto calculated"

                />



                <div className="relative">

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                    Location

                  </label>



                  <div className="relative">

                    <MapPin

                      size={17}

                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

                    />



                    <input

                      type="text"

                      value={locationSearch}

                      onChange={(e) => {

                        setLocationSearch(e.target.value);

                        setForm((prev) => ({

                          ...prev,

                          location: e.target.value,

                        }));

                      }}

                      placeholder="Search port or location..."

                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"

                    />

                  </div>



                  {locationSearching && (

                    <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">

                      Searching ports...

                    </div>

                  )}



                  {!locationSearching && locationResults.length > 0 && (

                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">

                      {locationResults.map((port) => (

                        <button

                          key={port._id || port.wpinumber || port.unlocode || port.mainPortName}

                          type="button"

                          onClick={() => {

                            setForm((prev) => ({

                              ...prev,

                              location: port.mainPortName,

                            }));

                            setLocationSearch(port.mainPortName || "");

                            setLocationResults([]);

                          }}

                          className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-sky-50"

                        >

                          <div className="text-sm font-semibold text-slate-800">

                            {port.mainPortName}

                          </div>

                          <div className="mt-0.5 text-xs text-slate-500">

                            {[port.countryCode, port.unlocode]

                              .filter(Boolean)

                              .join(" • ") || "WPI port"}

                          </div>

                        </button>

                      ))}

                    </div>

                  )}



                  {form.location && locationSearch === form.location && (

                    <p className="mt-1 text-[11px] text-slate-400">

                      Search and select a WPI port. The selected port name is saved as the location.

                    </p>

                  )}

                </div>

              </div>



              <div className="mt-4">

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">

                  Notes

                </label>



                <textarea

                  name="notes"

                  value={form.notes}

                  onChange={handleChange}

                  rows="3"

                  placeholder="Add notes about this fuel record..."

                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"

                />

              </div>



              {error && (

                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">

                  {error}

                </div>

              )}



              <div className="mt-6 flex justify-end gap-3">

                <button

                  type="button"

                  onClick={() => setShowModal(false)}

                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  disabled={saving}

                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"

                >

                  {saving

                    ? "Saving..."

                    : editingRecord

                    ? "Update Record"

                    : "Save Record"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* View Modal */}

      {showView && selectedRecord && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-sky-600">

                  Fuel Record

                </p>

                <h2 className="text-xl font-bold text-slate-900">

                  {formatRecordId(selectedRecord.recordId) || "Fuel Details"}

                </h2>

              </div>



              <button

                onClick={() => setShowView(false)}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"

              >

                <X size={20} />

              </button>

            </div>



            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">

              <Detail label="Vessel" value={getVesselName(selectedRecord)} />

              <Detail label="Voyage" value={getVoyageName(selectedRecord, voyages)} />

              <Detail label="Date" value={formatDate(selectedRecord.date)} />

              <Detail label="Fuel Type" value={selectedRecord.fuelType} />

              <Detail

                label="Fuel Used"

                value={`${formatNumber(selectedRecord.fuelUsed)} L`}

              />

              <Detail

                label="Remaining Fuel"

                value={`${formatNumber(selectedRecord.remainingFuel)} L`}

              />

              <Detail

                label="Distance"

                value={`${formatNumber(selectedRecord.distance)} km`}

              />

              <Detail

                label="Consumption Rate"

                value={`${Number(

                  selectedRecord.consumptionRate || 0

                ).toFixed(2)} L/km`}

              />

              <Detail

                label="Location"

                value={selectedRecord.location || "—"}

              />



              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                  Notes

                </p>

                <p className="mt-1 text-sm text-slate-700">

                  {selectedRecord.notes || "No notes added."}

                </p>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Delete Modal - matching the Voyage confirmation design */}
      {showDelete && deletingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle size={27} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Delete Fuel Record?</h2>
                    <p className="mt-1 text-sm text-slate-400">Permanent action</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (saving) return;
                    setShowDelete(false);
                    setDeletingRecord(null);
                    setError("");
                  }}
                  disabled={saving}
                  aria-label="Close delete confirmation"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this fuel record?
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <FuelIcon size={21} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Fuel Record</p>
                    <p className="truncate text-sm font-bold text-slate-800">
                      {formatRecordId(deletingRecord.recordId) || "Fuel record"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Vessel</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {getVesselName(deletingRecord)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Fuel Type</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {deletingRecord.fuelType || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Date</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {formatDate(deletingRecord.date)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {deletingRecord.location || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-5 text-red-500">
                This fuel record and its stored information will be permanently removed.
              </p>

              {error && (
                <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setDeletingRecord(null);
                  setError("");
                }}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={17} />
                {saving ? "Deleting..." : "Delete Fuel Record"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}



function StatCard({ icon, title, value, subtitle }) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">

            {value}

          </h3>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

        </div>



        <div className="rounded-xl bg-sky-50 p-3 text-sky-600">

          {icon}

        </div>

      </div>

    </div>

  );

}



function ActionButton({ children, onClick, title, danger }) {

  return (

    <button

      title={title}

      onClick={onClick}

      className={`rounded-lg p-2 transition ${

        danger

          ? "text-slate-400 hover:bg-red-50 hover:text-red-600"

          : "text-slate-400 hover:bg-sky-50 hover:text-sky-600"

      }`}

    >

      {children}

    </button>

  );

}



function Input({

  label,

  name,

  value,

  onChange,

  type = "text",

  required,

  readOnly,

  placeholder,

  min,

}) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-semibold text-slate-700">

        {label}

        {required && <span className="ml-1 text-red-500">*</span>}

      </label>



      <input

        name={name}

        type={type}

        value={value}

        onChange={onChange}

        required={required}

        readOnly={readOnly}

        min={min}

        placeholder={placeholder}

        className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${

          readOnly ? "bg-slate-100 text-slate-500" : "bg-slate-50"

        }`}

      />

    </div>

  );

}



function Select({ label, children, ...props }) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-semibold text-slate-700">

        {label}

        {props.required && <span className="ml-1 text-red-500">*</span>}

      </label>



      <select

        {...props}

        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"

      >

        {children}

      </select>

    </div>

  );

}



function Detail({ label, value }) {

  return (

    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">

        {label}

      </p>

      <p className="mt-1 font-semibold text-slate-800">{value || "—"}</p>

    </div>

  );

}