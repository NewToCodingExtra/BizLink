import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/client";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const token = params.get("token") || "";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Missing reset token. Open the link from your email again.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.resetPassword({ email: email.trim(), token, password, password_confirmation: confirm });
      navigate("/login", { replace: true, state: { reset: res.message } });
    } catch (err) {
      const errors = err?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err?.data?.message || err.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-[#1E3A5F]">BIZLINK · NEW PASSWORD</p>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-2">Set new password</h1>
        <p className="text-sm text-slate-500 mt-1">Links expire after 60 minutes.</p>

        {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {!token && <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">No token in this URL — use the link from your email.</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">New password</label>
            <div className="mt-1">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="Min 8 chars" autoComplete="new-password" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confirm</label>
            <div className="mt-1">
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" autoComplete="new-password" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Saving..." : "Reset password"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          <Link to="/login" className="text-[#2563EB] font-medium hover:text-[#1D4ED8]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
