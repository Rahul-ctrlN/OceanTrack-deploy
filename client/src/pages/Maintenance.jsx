import React, { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  CalendarClock,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import { api } from "../services/api";

const emptyForm = {
  maintenanceId: "",
  vessel: "",
  type: "",
  description: "",
  scheduledDate: "",
  completionDate: "",
  status: "Scheduled",
  cost: "",
  assignedPerson: "",
  notes: "",
};

const getMaintenanceDigits = (value) => {
  return String(value || "")
    .replace(/^MNT-/i, "")
    .replace(/\D/g, "")
    .slice(0, 6);
};

const formatMaintenanceId = (value) => {
  const digits = getMaintenanceDigits(value);

  if (!digits) return "";

  return `MNT-${digits.padStart(3, "0")}`;
};

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
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

function getEffectiveStatus(record) {
  if (!record) return "Scheduled";

  if (
    record.status !== "Completed" &&
    record.scheduledDate
  ) {
    const today = new Date();
    const scheduled = new Date(record.scheduledDate);

    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);

    if (scheduled < today) {
      return "Overdue";
    }
  }

  return record.status || "Scheduled";
}

function statusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700";

    case "In Progress":
      return "bg-sky-50 text-sky-700";

    case "Overdue":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vessels, setVessels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const [maintenanceRes, vesselRes] = await Promise.all([
        api.get("/maintenance"),
        api.get("/vessels"),
      ]);

      setRecords(
        Array.isArray(maintenanceRes.data)
          ? maintenanceRes.data
          : []
      );

      setVessels(
        Array.isArray(vesselRes.data) ? vesselRes.data : []
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Unable to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase().trim();

    return records.filter((record) => {
      const effectiveStatus = getEffectiveStatus(record);

      const matchesSearch =
        !term ||
        String(record.maintenanceId || "")
          .toLowerCase()
          .includes(term) ||
        getVesselName(record)
          .toLowerCase()
          .includes(term) ||
        String(record.type || "")
          .toLowerCase()
          .includes(term) ||
        String(record.assignedPerson || "")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "All" ||
        effectiveStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const totalMaintenance = records.length;

  const completed = records.filter(
    (record) => getEffectiveStatus(record) === "Completed"
  ).length;

  const inProgress = records.filter(
    (record) => getEffectiveStatus(record) === "In Progress"
  ).length;

  const overdue = records.filter(
    (record) => getEffectiveStatus(record) === "Overdue"
  ).length;

  const upcoming = records.filter((record) => {
    const status = getEffectiveStatus(record);

    if (status === "Completed" || status === "Overdue") {
      return false;
    }

    if (!record.scheduledDate) return false;

    const today = new Date();
    const scheduled = new Date(record.scheduledDate);

    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);

    const difference =
      (scheduled - today) / (1000 * 60 * 60 * 24);

    return difference >= 0 && difference <= 30;
  }).length;

  const totalCost = records.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );

  const openAddModal = () => {
    setEditingRecord(null);

    setForm({
      ...emptyForm,
      scheduledDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);

    setForm({
      maintenanceId: getMaintenanceDigits(record.maintenanceId),
      vessel:
        typeof record.vessel === "object"
          ? record.vessel._id || ""
          : record.vessel || "",
      type: record.type || "",
      description: record.description || "",
      scheduledDate: record.scheduledDate
        ? new Date(record.scheduledDate)
            .toISOString()
            .split("T")[0]
        : "",
      completionDate: record.completionDate
        ? new Date(record.completionDate)
            .toISOString()
            .split("T")[0]
        : "",
      status: record.status || "Scheduled",
      cost: record.cost ?? "",
      assignedPerson: record.assignedPerson || "",
      notes: record.notes || "",
    });

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

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.vessel || !form.type || !form.scheduledDate) {
      setError(
        "Please fill in vessel, maintenance type and scheduled date."
      );
      return;
    }

    if (Number(form.cost || 0) < 0) {
      setError("Maintenance cost cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        maintenanceId: form.maintenanceId ? formatMaintenanceId(form.maintenanceId) : undefined,
        vessel: form.vessel,
        type: form.type,
        description: form.description,
        scheduledDate: form.scheduledDate,
        completionDate: form.completionDate || undefined,
        status: form.status,
        cost: Number(form.cost || 0),
        assignedPerson: form.assignedPerson,
        notes: form.notes,
      };

      if (editingRecord) {
        await api.put(
          `/maintenance/${editingRecord._id}`,
          payload
        );
      } else {
        await api.post("/maintenance", payload);
      }

      setShowModal(false);
      setEditingRecord(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Unable to save maintenance record."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;

    try {
      setSaving(true);

      await api.delete(`/maintenance/${deletingRecord._id}`);

      setShowDelete(false);
      setDeletingRecord(null);

      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Unable to delete maintenance record."
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
            <Wrench size={17} />
            Fleet Operations
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Maintenance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor vessel maintenance schedules, costs and completion.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700"
        >
          <Plus size={18} />
          Schedule Maintenance
        </button>
      </div>

      {/* Stats */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<Wrench size={21} />}
          title="Total"
          value={totalMaintenance}
          subtitle="Maintenance records"
        />

        <StatCard
          icon={<Clock3 size={21} />}
          title="Upcoming"
          value={upcoming}
          subtitle="Next 30 days"
        />

        <StatCard
          icon={<AlertTriangle size={21} />}
          title="Overdue"
          value={overdue}
          subtitle="Needs attention"
          danger={overdue > 0}
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          title="Completed"
          value={completed}
          subtitle="Successfully completed"
        />

        <StatCard
          icon={<CalendarClock size={21} />}
          title="Total Cost"
          value={formatCurrency(totalCost)}
          subtitle="Recorded maintenance cost"
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
              placeholder="Search maintenance, vessel or assigned person..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-400"
          >
            <option value="All">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
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
                <th className="px-5 py-4">Maintenance</th>
                <th className="px-5 py-4">Vessel</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Scheduled</th>
                <th className="px-5 py-4">Completion</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Cost</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-14 text-center"
                  >
                    <Wrench
                      size={35}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="font-medium text-slate-600">
                      No maintenance records found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const status = getEffectiveStatus(record);

                  return (
                    <tr
                      key={record._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {formatMaintenanceId(record.maintenanceId) || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800">
                          {getVesselName(record)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {record.type || "—"}
                        </div>

                        {record.description && (
                          <div className="mt-1 max-w-[200px] truncate text-xs text-slate-400">
                            {record.description}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(record.scheduledDate)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(record.completionDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatCurrency(record.cost)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <UserRound
                            size={15}
                            className="text-slate-400"
                          />
                          {record.assignedPerson || "Unassigned"}
                        </div>
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
                  );
                })
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
          maintenance records
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingRecord
                    ? "Edit Maintenance"
                    : "Schedule Maintenance"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add vessel maintenance information.
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
                <FixedIdInput
                  label="Maintenance ID"
                  prefix="MNT-"
                  value={getMaintenanceDigits(form.maintenanceId)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      maintenanceId: value,
                    }))
                  }
                  placeholder="001"
                />

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

                <Input
                  label="Maintenance Type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  placeholder="Engine Inspection"
                />

                <Select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </Select>

                <Input
                  label="Scheduled Date"
                  name="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Completion Date"
                  name="completionDate"
                  type="date"
                  value={form.completionDate}
                  onChange={handleChange}
                />

                <Input
                  label="Cost (₹)"
                  name="cost"
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="50000"
                />

                <Input
                  label="Assigned Person"
                  name="assignedPerson"
                  value={form.assignedPerson}
                  onChange={handleChange}
                  placeholder="Chief Engineer"
                />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the maintenance work..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
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
                  placeholder="Additional maintenance notes..."
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
                    ? "Update Maintenance"
                    : "Schedule Maintenance"}
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
                  Maintenance Record
                </p>

                <h2 className="text-xl font-bold text-slate-900">
                  {formatMaintenanceId(selectedRecord.maintenanceId) ||
                    "Maintenance Details"}
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
              <Detail
                label="Vessel"
                value={getVesselName(selectedRecord)}
              />

              <Detail
                label="Maintenance Type"
                value={selectedRecord.type}
              />

              <Detail
                label="Scheduled Date"
                value={formatDate(
                  selectedRecord.scheduledDate
                )}
              />

              <Detail
                label="Completion Date"
                value={formatDate(
                  selectedRecord.completionDate
                )}
              />

              <Detail
                label="Status"
                value={getEffectiveStatus(selectedRecord)}
              />

              <Detail
                label="Cost"
                value={formatCurrency(selectedRecord.cost)}
              />

              <Detail
                label="Assigned Person"
                value={selectedRecord.assignedPerson}
              />

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedRecord.description ||
                    "No description added."}
                </p>
              </div>

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
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle size={26} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Delete Maintenance?
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Permanent action
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      setShowDelete(false);
                      setDeletingRecord(null);
                    }
                  }}
                  disabled={saving}
                  aria-label="Close delete confirmation"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this maintenance record?
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Wrench size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Maintenance Record</p>
                    <p className="truncate text-sm font-bold text-slate-800">
                      {formatMaintenanceId(deletingRecord.maintenanceId) || "Maintenance record"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Vessel</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {getVesselName(deletingRecord)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Maintenance Type</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {deletingRecord.type || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Scheduled Date</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDate(deletingRecord.scheduledDate)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {getEffectiveStatus(deletingRecord)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-red-500">
                This maintenance record and its stored information will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowDelete(false);
                    setDeletingRecord(null);
                  }
                }}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {saving ? "Deleting..." : "Delete Maintenance"}
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
  subtitle,
  danger,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3
            className={`mt-2 text-2xl font-bold ${
              danger ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-sky-50 text-sky-600"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
}) {
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

function FixedIdInput({
  label,
  prefix,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex h-[43px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
        <span className="flex items-center border-r border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-sky-700">
          {prefix}
        </span>

        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/\\D/g, "").slice(0, 6))
          }
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-700 outline-none"
        />
      </div>

      <p className="mt-1 text-[11px] text-slate-400">
        Enter numbers only. ID will be saved as {prefix}001, {prefix}002, etc.
      </p>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  min,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function Select({
  label,
  children,
  ...props
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {props.required && (
          <span className="ml-1 text-red-500">*</span>
        )}
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

      <p className="mt-1 font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}