import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message || "Reset link sent.");
    } catch (err) {
      setError(err?.data?.message || err.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-[#1E3A5F]">BIZLINK · PASSWORD RESET</p>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-2">Forgot password</h1>
        <p className="text-sm text-slate-500 mt-1">Email accounts only — Google/Facebook accounts sign in with those buttons.</p>

        {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {message && <p className="mt-4 text-sm text-[#16A34A] bg-green-50 border border-green-100 rounded-lg px-3 py-2">{message}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <button type="submit" disabled={busy} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Remembered it? <Link to="/login" className="text-[#2563EB] font-medium hover:text-[#1D4ED8]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
