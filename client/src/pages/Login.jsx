import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Anchor,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Ship,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(cleanEmail, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        <div className="hidden lg:flex relative bg-sky-700 text-white p-12 flex-col justify-between overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-sky-500/40" />
          <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-blue-900/30" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <Anchor size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">OceanTrack</h1>
                <p className="text-xs text-sky-100">Smart Shipping Fleet Management</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-5">
              Manage your fleet.
              <br />
              Track every voyage.
            </h2>
            <p className="text-sky-100 leading-relaxed max-w-md">
              A centralized platform to manage vessels, voyages, cargo,
              fuel consumption and maintenance operations from one place.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <Ship size={19} />
              </div>
              <span className="text-sm text-sky-50">Centralized fleet monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck size={19} />
              </div>
              <span className="text-sm text-sky-50">Secure role-based access</span>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center">
              <Anchor className="text-white" size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">OceanTrack</h1>
              <p className="text-[10px] text-slate-500">Fleet Management</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-sky-600 mb-2">Welcome back</p>
            <h2 className="text-3xl font-bold text-slate-900">Sign in to OceanTrack</h2>
            <p className="text-sm text-slate-500 mt-2">Access your shipping fleet dashboard.</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-sky-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="animate-spin" size={19} />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                Create Account
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
            <ShieldCheck size={15} />
            Secure access to your fleet
          </div>
        </div>
      </div>
    </div>
  );
}
