import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Eye,
  X,
  Ship,
  Scale,
  Boxes,
} from "lucide-react";
import api from "../services/api.js";

const STATUS_OPTIONS = ["Pending", "Loaded", "In Transit", "Delivered"];

const CARGO_TYPES = [
  "Containerized Cargo",
  "General Cargo",
  "Dry Bulk",
  "Liquid Bulk",
  "Refrigerated Cargo",
  "Hazardous Cargo",
  "Vehicles",
  "Machinery",
  "Electronics",
  "Food & Beverages",
  "Raw Materials",
  "Other",
];

const emptyForm = {
  cargoNumber: "",
  voyage: "",
  description: "",
  cargoType: "",
  quantity: "",
  weight: "",
  status: "Pending",
};

const formatCargoNumber = (value) => {
  const digits = String(value || "").replace(/\\D/g, "").slice(0, 6);

  if (!digits) return "";

  return `CRG-${digits.padStart(3, "0")}`;
};

const getCargoDigits = (value) => {
  return String(value || "")
    .replace(/^CRG-/i, "")
    .replace(/\\D/g, "")
    .slice(0, 6);
};

const inputClass =
  "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500";

const selectClass =
  "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500";

export default function Cargo() {
  const [cargoList, setCargoList] = useState([]);
  const [voyages, setVoyages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [cargoRes, voyagesRes] = await Promise.all([
        api.get("/cargo"),
        api.get("/voyages"),
      ]);

      const cargoData = Array.isArray(cargoRes.data)
        ? cargoRes.data
        : Array.isArray(cargoRes.data?.cargo)
        ? cargoRes.data.cargo
        : [];

      const voyageData = Array.isArray(voyagesRes.data)
        ? voyagesRes.data
        : Array.isArray(voyagesRes.data?.voyages)
        ? voyagesRes.data.voyages
        : Array.isArray(voyagesRes.data?.data)
        ? voyagesRes.data.data
        : [];

      setCargoList(cargoData);
      setVoyages(voyageData);
      setError("");
    } catch (err) {
      console.error("Cargo loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load cargo records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /*
   * Get the displayed Voyage ID.
   * Supports:
   * 1. Populated voyage object
   * 2. MongoDB ObjectId
   * 3. Voyage ID such as "111"
   * 4. Old voyageNumber
   */
  const getVoyageName = (voyage) => {
    if (!voyage) return "—";

    if (typeof voyage === "object") {
      return (
        voyage.voyageId ||
        voyage.voyageNumber ||
        "—"
      );
    }

    const value = String(voyage);

    const found = voyages.find(
      (v) =>
        String(v._id) === value ||
        String(v.voyageId || "") === value ||
        String(v.voyageNumber || "") === value
    );

    if (!found) return "—";

    return (
      found.voyageId ||
      found.voyageNumber ||
      "—"
    );
  };

  /*
   * Convert stored voyage value to the MongoDB _id
   * when editing an existing cargo record.
   */
  const getVoyageId = (voyage) => {
    if (!voyage) return "";

    if (typeof voyage === "object") {
      return voyage._id || "";
    }

    const value = String(voyage);

    const found = voyages.find(
      (v) =>
        String(v._id) === value ||
        String(v.voyageId || "") === value ||
        String(v.voyageNumber || "") === value
    );

    return found?._id || value;
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (cargo) => {
    setEditingId(cargo._id);

    setForm({
      cargoNumber: getCargoDigits(cargo.cargoNumber),
      voyage: getVoyageId(cargo.voyage),
      description: cargo.description || "",
      cargoType: cargo.cargoType || "",
      quantity: cargo.quantity ?? "",
      weight: cargo.weight ?? "",
      status: cargo.status || "Pending",
    });

    setFormError("");
    setModalOpen(true);
  };

  const openViewModal = (cargo) => {
    setSelectedCargo(cargo);
    setViewOpen(true);
  };

  const openDeleteModal = (cargo) => {
    setSelectedCargo(cargo);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!getCargoDigits(form.cargoNumber)) {
      setFormError("Cargo ID is required.");
      return;
    }

    if (!form.voyage) {
      setFormError("Please select a voyage.");
      return;
    }

    if (!form.cargoType) {
      setFormError("Cargo type is required.");
      return;
    }

    if (Number(form.quantity) < 0) {
      setFormError("Quantity cannot be negative.");
      return;
    }

    if (Number(form.weight) < 0) {
      setFormError("Weight cannot be negative.");
      return;
    }

    setSaving(true);

    const payload = {
      cargoNumber: formatCargoNumber(form.cargoNumber),
      voyage: form.voyage,
      description: form.description.trim(),
      cargoType: form.cargoType,
      quantity: Number(form.quantity) || 0,
      weight: Number(form.weight) || 0,
      status: form.status,
    };

    try {
      if (editingId) {
        await api.put(`/cargo/${editingId}`, payload);
      } else {
        await api.post("/cargo", payload);
      }

      setModalOpen(false);
      setFormError("");

      await fetchData();
    } catch (err) {
      console.error("Cargo save error:", err);

      setFormError(
        err?.response?.data?.message ||
          "Failed to save cargo record."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCargo?._id) return;

    setDeleting(true);

    try {
      await api.delete(`/cargo/${selectedCargo._id}`);

      setDeleteOpen(false);
      setSelectedCargo(null);

      await fetchData();
    } catch (err) {
      console.error("Cargo delete error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to delete cargo record."
      );

      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCargo = cargoList.filter((cargo) => {
    const text = search.toLowerCase();

    const voyageName = getVoyageName(
      cargo.voyage
    ).toLowerCase();

    const matchesSearch =
      !search ||
      cargo.cargoNumber
        ?.toLowerCase()
        .includes(text) ||
      cargo.cargoType
        ?.toLowerCase()
        .includes(text) ||
      cargo.description
        ?.toLowerCase()
        .includes(text) ||
      voyageName.includes(text);

    const matchesStatus =
      !statusFilter ||
      cargo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCargo = cargoList.length;

  const pendingCargo = cargoList.filter(
    (c) => c.status === "Pending"
  ).length;

  const inTransitCargo = cargoList.filter(
    (c) => c.status === "In Transit"
  ).length;

  const totalWeight = cargoList.reduce(
    (sum, c) =>
      sum + Number(c.weight || 0),
    0
  );

  const statusClass = (status) => {
    if (status === "Delivered") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "In Transit") {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }

    if (status === "Loaded") {
      return "bg-violet-50 text-violet-700 border-violet-200";
    }

    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-sm font-semibold uppercase tracking-wide">
            <Package size={18} />
            Cargo Operations
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Cargo
          </h1>

          <p className="text-slate-500 mt-1">
            Manage shipments, cargo status and voyage assignments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-sky-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
        >
          <Plus size={19} />
          Add Cargo
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          icon={<Boxes size={21} />}
          title="Total Cargo"
          value={totalCargo}
        />

        <StatCard
          icon={<Package size={21} />}
          title="Pending"
          value={pendingCargo}
          valueClass="text-amber-600"
        />

        <StatCard
          icon={<Ship size={21} />}
          title="In Transit"
          value={inTransitCargo}
          valueClass="text-sky-600"
        />

        <StatCard
          icon={<Scale size={21} />}
          title="Total Weight"
          value={totalWeight.toLocaleString()}
          suffix="kg"
          valueClass="text-emerald-600"
        />

      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search cargo, type, description or voyage..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="lg:w-56 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-100">

          <h2 className="text-lg font-bold text-slate-800">
            Cargo Records
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            {filteredCargo.length} record
            {filteredCargo.length !== 1
              ? "s"
              : ""}{" "}
            displayed
          </p>

        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            Loading cargo records...
          </div>
        ) : filteredCargo.length === 0 ? (
          <div className="py-16 text-center">

            <Package
              size={40}
              className="mx-auto text-slate-300"
            />

            <p className="text-sm font-semibold text-slate-500 mt-3">
              No cargo found
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Try changing your search or filter.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Cargo
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Voyage
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Type
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Quantity
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Weight
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredCargo.map((cargo) => (

                  <tr
                    key={cargo._id}
                    className="hover:bg-slate-50 transition-colors"
                  >

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                          <Package size={21} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {formatCargoNumber(cargo.cargoNumber)}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {cargo.description ||
                              "No description"}
                          </p>
                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Ship
                          size={17}
                          className="text-slate-400"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {getVoyageName(cargo.voyage)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {cargo.cargoType || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {Number(
                        cargo.quantity || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {Number(
                        cargo.weight || 0
                      ).toLocaleString()}{" "}
                      kg
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-semibold ${statusClass(
                          cargo.status
                        )}`}
                      >
                        {cargo.status}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex items-center justify-end gap-4">

                        <button
                          onClick={() =>
                            openViewModal(cargo)
                          }
                          title="View"
                          className="text-slate-400 hover:text-sky-600"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() =>
                            openEditModal(cargo)
                          }
                          title="Edit"
                          className="text-slate-400 hover:text-sky-600"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() =>
                            openDeleteModal(cargo)
                          }
                          title="Delete"
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  {editingId
                    ? "Edit Cargo"
                    : "Add Cargo"}
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  {editingId
                    ? "Update cargo shipment details."
                    : "Create a new cargo shipment."}
                </p>

              </div>

              <button
                onClick={() =>
                  setModalOpen(false)
                }
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              {formError && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Cargo ID *
                  </label>

                  <div className="flex h-[46px] overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-sky-500">
                    <span className="flex items-center bg-slate-50 px-4 text-sm font-semibold text-sky-700 border-r border-slate-200">
                      CRG-
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={getCargoDigits(form.cargoNumber)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cargoNumber:
                            getCargoDigits(
                              e.target.value
                            ),
                        })
                      }
                      placeholder="001"
                      className="min-w-0 flex-1 px-3 text-sm text-slate-700 outline-none"
                    />
                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Enter numbers only. Cargo ID will be saved as CRG-001, CRG-002, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Voyage *
                  </label>

                  <select
                    value={form.voyage}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        voyage: e.target.value,
                      })
                    }
                    className={selectClass}
                  >

                    <option value="">
                      Select Voyage
                    </option>

                    {voyages.map((voyage) => (
                      <option
                        key={voyage._id}
                        value={voyage._id}
                      >
                        {voyage.voyageId ||
                          voyage.voyageNumber ||
                          "Unnamed Voyage"}
                      </option>
                    ))}

                  </select>
                </div>

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Description
                  </label>

                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="Describe the cargo"
                    className={inputClass}
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Cargo Type *
                  </label>

                  <select
                    value={form.cargoType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cargoType:
                          e.target.value,
                      })
                    }
                    className={selectClass}
                  >
                    <option value="">
                      Select Cargo Type
                    </option>

                    {CARGO_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className={selectClass}
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

                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity:
                          e.target.value,
                      })
                    }
                    placeholder="0"
                    className={inputClass}
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Weight (kg)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weight:
                          e.target.value,
                      })
                    }
                    placeholder="0"
                    className={inputClass}
                  />

                </div>

              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Cargo"
                    : "Add Cargo"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {viewOpen && selectedCargo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Cargo Details
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  {selectedCargo.cargoNumber}
                </p>

              </div>

              <button
                onClick={() =>
                  setViewOpen(false)
                }
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6 space-y-4">

              <Detail
                label="Cargo ID"
                value={
                  selectedCargo.cargoNumber
                }
              />

              <Detail
                label="Voyage"
                value={getVoyageName(
                  selectedCargo.voyage
                )}
              />

              <Detail
                label="Cargo Type"
                value={
                  selectedCargo.cargoType
                }
              />

              <Detail
                label="Description"
                value={
                  selectedCargo.description
                }
              />

              <Detail
                label="Quantity"
                value={Number(
                  selectedCargo.quantity || 0
                ).toLocaleString()}
              />

              <Detail
                label="Weight"
                value={`${Number(
                  selectedCargo.weight || 0
                ).toLocaleString()} kg`}
              />

              <div className="flex items-center justify-between py-3 border-b border-slate-100">

                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${statusClass(
                    selectedCargo.status
                  )}`}
                >
                  {selectedCargo.status}
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {deleteOpen && selectedCargo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[20px] bg-white shadow-2xl">
            <div className="px-7 pb-7 pt-7">
              <div className="flex items-start justify-between">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (deleting) return;
                    setDeleteOpen(false);
                    setSelectedCargo(null);
                  }}
                  disabled={deleting}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                >
                  <X size={22} />
                </button>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-800">
                Delete Cargo?
              </h2>

              <p className="mt-2 text-base text-slate-500">
                Are you sure you want to delete this cargo?
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Package size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Cargo
                    </p>
                    <p className="text-base font-bold text-slate-800">
                      {formatCargoNumber(selectedCargo.cargoNumber) || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Voyage
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-700">
                      {getVoyageName(selectedCargo.voyage)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Cargo Type
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-700">
                      {selectedCargo.cargoType || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm text-red-500">
                This cargo and its stored information will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
              <button
                type="button"
                onClick={() => {
                  if (deleting) return;
                  setDeleteOpen(false);
                  setSelectedCargo(null);
                }}
                disabled={deleting}
                className="h-[52px] rounded-xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-[52px] items-center gap-2 rounded-xl bg-red-600 px-6 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
                {deleting ? "Deleting..." : "Delete Cargo"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  suffix,
  valueClass = "text-slate-800",
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="text-slate-400">
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>

      </div>

      <div className="mt-4">

        <span
          className={`text-3xl font-bold ${valueClass}`}
        >
          {value}
        </span>

        {suffix && (
          <span className="block text-xs text-slate-400 mt-1">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-5 py-3 border-b border-slate-100">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-800 text-right">
        {value || "—"}
      </span>

    </div>
  );
}