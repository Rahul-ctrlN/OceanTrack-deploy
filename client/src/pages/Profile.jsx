import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api.js";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordModal, setPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await api.get("/auth/me");
      const data = response.data.user;

      setUser(data);
      setName(data.name || "");
      setEmail(data.email || "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      const updatedUser = {
        ...user,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      };

      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function openPasswordModal() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);

    setPasswordError("");
    setPasswordSuccess("");

    setPasswordModal(true);
  }

  function closePasswordModal() {
    if (changingPassword) return;

    setPasswordModal(false);
    setPasswordError("");
    setPasswordSuccess("");
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setPasswordError(
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );

      setPasswordSuccess(
        response.data.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPasswordModal(false);
        setPasswordSuccess("");
      }, 1200);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function initials(nameValue) {
    return (
      String(nameValue || "User")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "U"
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full px-1 sm:px-2 lg:px-4 py-2">
        <div className="max-w-3xl mx-auto">

          {/* HEADER */}
          <div className="mb-7">
            <h1 className="text-3xl sm:text-4xl font-bold ocean-title">
              Profile
            </h1>

            <p className="mt-1 ocean-subtitle">
              View and manage your account details
            </p>
          </div>

          {/* SUCCESS */}
          {message && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <CheckCircle size={19} />

              <span className="text-sm font-medium">
                {message}
              </span>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle size={19} />

              <span className="text-sm font-medium">
                {error}
              </span>
            </div>
          )}

          {/* PROFILE CARD */}
          <div className="ocean-card rounded-2xl border shadow-sm overflow-hidden">

            {/* PROFILE HEADER */}
            <div className="px-6 sm:px-10 pt-9 pb-8">
              <div className="flex flex-col items-center text-center">

                <div className="w-24 h-24 rounded-full bg-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {initials(user?.name)}
                </div>

                <h2 className="mt-5 text-2xl font-bold ocean-title">
                  {user?.name || "User"}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-sm ocean-subtitle">
                  <ShieldCheck size={17} />

                  <span className="capitalize">
                    {user?.role || "staff"}
                  </span>
                </div>
              </div>
            </div>

            {/* PROFILE FORM */}
            <form
              onSubmit={handleSaveProfile}
              className="px-6 sm:px-10 pb-10"
            >

              {/* FULL NAME */}
              <div className="mb-6">
                <label className="block text-sm font-semibold ocean-label mb-3">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full h-[72px] rounded-lg border ocean-input pl-14 pr-5 text-base outline-none transition focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="mb-4">
                <label className="block text-sm font-semibold ocean-label mb-3">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full h-[72px] rounded-lg border ocean-input pl-14 pr-5 text-base outline-none transition focus:ring-2 focus:ring-sky-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* CHANGE PASSWORD */}
              <button
                type="button"
                onClick={openPasswordModal}
                className="group mb-7 flex items-center gap-2 text-base font-semibold text-sky-600 hover:text-sky-700 transition"
              >
                <Lock size={19} />

                <span>
                  Change Password
                </span>

                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              {/* ROLE */}
              <div className="mb-7">
                <label className="block text-sm font-semibold ocean-label mb-3">
                  Role
                </label>

                <div className="relative">
                  <ShieldCheck
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={
                      user?.role
                        ? user.role
                            .charAt(0)
                            .toUpperCase() +
                          user.role.slice(1)
                        : "Staff"
                    }
                    disabled
                    className="w-full h-[72px] rounded-lg border ocean-input pl-14 pr-5 text-base bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <p className="mt-2 text-xs ocean-subtitle">
                  Only an admin can change roles.
                </p>
              </div>

              {/* SAVE BUTTON */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-14 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold text-base transition shadow-sm"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {passwordModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closePasswordModal();
            }
          }}
        >

          {/* DARK BACKDROP */}
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

          {/* WHITE MODAL */}
          <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-7 py-6 border-b border-slate-200">

              <div>
                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                    <Lock size={22} />
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Change Password
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Update your account password securely.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={21} />
              </button>
            </div>

            {/* MODAL FORM */}
            <form
              onSubmit={handleChangePassword}
              className="p-7"
            >

              {/* ERROR */}
              {passwordError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">

                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="text-sm">
                    {passwordError}
                  </span>
                </div>
              )}

              {/* SUCCESS */}
              {passwordSuccess && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">

                  <CheckCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="text-sm">
                    {passwordSuccess}
                  </span>
                </div>
              )}

              {/* CURRENT PASSWORD */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Current Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    className="w-full h-[72px] rounded-lg border border-slate-300 bg-white text-slate-900 pl-14 pr-14 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrent(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  New Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    className="w-full h-[72px] rounded-lg border border-slate-300 bg-white text-slate-900 pl-14 pr-14 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNew(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Password must contain at least 6 characters.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Confirm New Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="w-full h-[72px] rounded-lg border border-slate-300 bg-white text-slate-900 pl-14 pr-14 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-4">

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="flex-1 h-14 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 h-14 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold transition"
                >
                  {changingPassword
                    ? "Updating..."
                    : "Change Password"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}