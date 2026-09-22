import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, checkSocialConfigured } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import { FacebookIcon, GoogleIcon } from "../components/SocialIcons";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@bizlink.ph");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(null);

  const from = location.state?.from || "/feed";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await login(email.trim(), password);
      sessionStorage.setItem('welcome_toast', `Welcome back, ${res.user?.name || 'User'}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.errors?.email?.[0] || err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider) => {
    setError("");
    setSocialBusy(provider);
    try {
      await checkSocialConfigured(provider);
      authApi.socialRedirect(provider);
    } catch (err) {
      setError(err.message || `${provider} redirect failed`);
    } finally {
      setSocialBusy(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · LOGIN</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Session is issued by Laravel Sanctum and stored in MySQL.</p>

        {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-action hover:text-[#1D4ED8]">Forgot password?</Link>
            </div>
            <div className="mt-1">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-bg" />
          <span className="text-xs text-text-secondary">or continue with</span>
          <div className="flex-1 h-px bg-bg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => social("google")} disabled={socialBusy !== null} className="bg-surface border border-border hover:bg-bg disabled:opacity-60 text-text-primary text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <GoogleIcon size={20} />
            {socialBusy === "google" ? "..." : "Google"}
          </button>
          <button onClick={() => social("facebook")} disabled={socialBusy !== null} className="bg-[#1877F2] hover:bg-[#1464CC] disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <FacebookIcon size={20} />
            {socialBusy === "facebook" ? "..." : "Facebook"}
          </button>
        </div>

        <p className="text-sm text-text-secondary mt-5 text-center">
          No account? <Link to="/register" className="text-action font-medium hover:text-[#1D4ED8]">Register</Link>
        </p>
      </div>
    </div>
  );
}
