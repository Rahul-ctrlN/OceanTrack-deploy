import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users as UsersIcon,
  ShieldCheck,
  UserRound,
  Mail,
  X,
} from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const adminUser = users.find(
    (u) => String(u.role).toLowerCase() === "admin"
  );

  const staffUsers = users.filter(
    (u) => String(u.role).toLowerCase() !== "admin"
  );

  const searchText = search.trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!searchText) {
      return staffUsers;
    }

    return staffUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchText) ||
        u.email?.toLowerCase().includes(searchText)
    );
  }, [staffUsers, searchText]);

  const openAddStaffModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingId(u._id);

    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
    });

    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setFormError("Name and email are required.");
      return;
    }

    if (!editingId && !form.password) {
      setFormError("Password is required for a new staff account.");
      return;
    }

    if (form.password && form.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const payload = {
          name,
          email,
        };

        if (form.password) {
          payload.password = form.password;
        }

        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post("/users", {
          name,
          email,
          password: form.password,
          role: "staff",
        });
      }

      closeModal();
      await fetchUsers();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (u) => {
    if (u._id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    if (String(u.role).toLowerCase() === "admin") {
      alert("The OceanTrack administrator cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${u.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/users/${u._id}`);
      await fetchUsers();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Failed to delete staff account."
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <div className="flex items-center gap-2 text-sky-600 mb-2">
          <UsersIcon size={19} />

          <span className="text-sm font-semibold uppercase tracking-wide">
            User Management
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-800">
          Users
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage the OceanTrack administrator and staff accounts.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* ADMIN CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Administrator
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {adminUser ? "1" : "0"}
                </p>
              </div>

            </div>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Admin
            </span>

          </div>
        </div>

        {/* STAFF CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <UserRound size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Staff Accounts
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {staffUsers.length}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ADMINISTRATOR SECTION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Administrator
              </h2>

              <p className="text-sm text-slate-500">
                The single administrator account for OceanTrack.
              </p>
            </div>

          </div>

        </div>

        {loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            Loading administrator...
          </div>
        ) : !adminUser ? (
          <div className="px-6 py-8 text-sm text-red-600">
            No administrator account found.
          </div>
        ) : (
          <div className="px-6 py-5">

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 text-white">
                  <ShieldCheck size={23} />
                </div>

                <div>

                  <h3 className="font-semibold text-slate-800">
                    {adminUser.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={14} />
                    {adminUser.email}
                  </div>

                </div>

              </div>

              <div className="flex items-center gap-3">

                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  Administrator
                </span>

                <button
                  onClick={() => openEditModal(adminUser)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-sky-600"
                  title="Edit administrator"
                >
                  <Pencil size={17} />
                </button>

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              The administrator account cannot be deleted or changed to Staff.
            </p>

          </div>
        )}

      </div>

      {/* STAFF SECTION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* STAFF HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <UsersIcon size={20} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Staff Accounts
              </h2>

              <p className="text-sm text-slate-500">
                {filteredStaff.length} staff account
                {filteredStaff.length === 1 ? "" : "s"} displayed
              </p>

            </div>

          </div>

          {/* ADD STAFF ONLY HERE */}
          <button
            onClick={openAddStaffModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus size={17} />
            Add Staff
          </button>

        </div>

        {/* STAFF SEARCH */}
        <div className="border-b border-slate-200 px-6 py-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

          </div>

        </div>

        {/* STAFF TABLE */}
        {loading ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            Loading staff accounts...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="px-6 py-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <UserRound size={22} />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-700">
              No staff accounts found.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Add a staff account to manage OceanTrack operations.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Staff Member
                  </th>

                  <th className="px-6 py-4">
                    Email
                  </th>

                  <th className="px-6 py-4">
                    Role
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStaff.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50"
                  >

                    {/* STAFF NAME */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                          <UserRound size={18} />
                        </div>

                        <div>

                          <p className="font-semibold text-slate-800">
                            {u.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            Staff member
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-4 text-slate-600">

                      <div className="flex items-center gap-2">

                        <Mail
                          size={15}
                          className="text-slate-400"
                        />

                        {u.email}

                      </div>

                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-4">

                      <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                        Staff
                      </span>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">

                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
                          title="Edit staff"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDeleteStaff(u)}
                          disabled={u._id === currentUser?.id}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            u._id === currentUser?.id
                              ? "You cannot delete your own account"
                              : "Delete staff"
                          }
                        >
                          <Trash2 size={17} />
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

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit User" : "Add Staff"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingId
                    ? "Update account information."
                    : "Create a new OceanTrack staff account."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* NAME */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* EMAIL */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Password

                  {editingId && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Leave blank to keep current password
                    </span>
                  )}

                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  placeholder={
                    editingId
                      ? "Enter new password"
                      : "Enter password"
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />

              </div>

              {/* STAFF ROLE INFO */}
              {!editingId && (
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">

                  <div className="flex items-center gap-2">

                    <UserRound
                      size={17}
                      className="text-sky-600"
                    />

                    <span className="text-sm font-semibold text-sky-800">
                      Staff Account
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-sky-700">
                    This account will automatically be created as a Staff member.
                  </p>

                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update User"
                  : "Add Staff"}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}