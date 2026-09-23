import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import CreativeLoader from "../components/CreativeLoader";
import { authApi, checkSocialConfigured } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import { FacebookIcon, GoogleIcon } from "../components/SocialIcons";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("demo@bizlink.ph");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(null);
  const [welcomeName, setWelcomeName] = useState(null);

  const from = location.state?.from || "/feed";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error("Please fill in both fields");
    
    setBusy(true);
    try {
      const res = await login(email.trim(), password);
      toast.success("Welcome back!");
      setWelcomeName(res.user?.name || 'User');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
    } catch (err) {
      const errors = err?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      toast.error(first || err.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider) => {
    setSocialBusy(provider);
    try {
      await checkSocialConfigured(provider);
      authApi.socialRedirect(provider);
    } catch (err) {
      toast.error(err.message || `${provider} login failed`);
    } finally {
      setSocialBusy(null);
    }
  };

  if (welcomeName) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--color-primary)] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-action)]/20 to-transparent opacity-50" />
        <div className="relative z-10 flex flex-col items-center animate-toast-slide-up">
          <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full border border-[var(--color-border)] shadow-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-[var(--color-action)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">Welcome back!</h2>
          <p className="text-lg text-[var(--color-text-secondary)]">{welcomeName}</p>
        </div>
      </div>
    );
  }

  if (busy) {
    return (
      <div className="fixed inset-0 z-[100] bg-bg/80 backdrop-blur-sm flex items-center justify-center">
        <CreativeLoader text="Logging in..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · LOGIN</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Session is issued by Laravel Sanctum and stored in MySQL.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-[var(--color-action)] hover:text-[var(--color-action-hover)]">Forgot password?</Link>
            </div>
            <div className="mt-1">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Log in
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

        <p className="text-sm text-[var(--color-text-secondary)] mt-5 text-center">
          No account? <Link to="/register" className="text-[var(--color-action)] font-medium hover:text-[var(--color-action-hover)]">Register</Link>
        </p>
      </div>
    </div>
  );
}
