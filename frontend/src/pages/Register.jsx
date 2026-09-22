import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, checkSocialConfigured } from "../api/client";
import PasswordInput from "../components/PasswordInput";
import { FacebookIcon, GoogleIcon } from "../components/SocialIcons";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("entrepreneur");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
        role,
      });
      navigate("/feed", { replace: true });
    } catch (err) {
      const errors = err?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err.message || "Registration failed");
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
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · REGISTER</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Create account</h1>
        <p className="text-sm text-text-secondary mt-1">Join as entrepreneur or brand. Stored in MySQL via Laravel.</p>

        {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => social("google")} disabled={socialBusy !== null} className="bg-surface border border-border hover:bg-bg disabled:opacity-60 text-text-primary text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <GoogleIcon size={20} />
            {socialBusy === "google" ? "..." : "Google"}
          </button>
          <button onClick={() => social("facebook")} disabled={socialBusy !== null} className="bg-[#1877F2] hover:bg-[#1464CC] disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <FacebookIcon size={20} />
            {socialBusy === "facebook" ? "..." : "Facebook"}
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-bg" />
          <span className="text-xs text-text-secondary">or with email</span>
          <div className="flex-1 h-px bg-bg" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Juan Dela Cruz" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary">Password</label>
              <div className="mt-1">
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="Min 8 chars" autoComplete="new-password" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary">Confirm</label>
              <div className="mt-1">
                <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" autoComplete="new-password" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary">I am a</label>
            <div className="mt-2 flex gap-2">
              {["entrepreneur", "brand"].map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${role === r ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          Have an account? <Link to="/login" className="text-action font-medium hover:text-[#1D4ED8]">Log in</Link>
        </p>
      </div>
    </div>
  );
}
