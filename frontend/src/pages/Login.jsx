import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@bizlink.ph");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const from = location.state?.from || "/feed";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.errors?.email?.[0] || err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setGoogleBusy(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/auth/google/redirect`, {
        headers: { Accept: "application/json" },
      });
      if (res.status === 503) {
        const data = await res.json();
        setError(data.message || "Google OAuth is not configured");
        return;
      }
      authApi.googleRedirect();
    } catch (err) {
      setError(err.message || "Google redirect failed");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-[#1E3A5F]">BIZLINK · LOGIN</p>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-2">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Session is issued by Laravel Sanctum and stored in MySQL.</p>

        {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <button type="submit" disabled={busy} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button onClick={google} disabled={googleBusy} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white grid place-items-center text-xs font-bold">G</span>
          {googleBusy ? "Redirecting..." : "Continue with Google"}
        </button>

        <p className="text-sm text-slate-500 mt-5 text-center">
          No account? <Link to="/register" className="text-[#2563EB] font-medium hover:text-[#1D4ED8]">Register</Link>
        </p>
      </div>
    </div>
  );
}
