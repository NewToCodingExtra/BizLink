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
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-primary-light">BIZLINK · PASSWORD RESET</p>
        <h1 className="text-2xl font-bold text-primary mt-2">Forgot password</h1>
        <p className="text-sm text-text-secondary mt-1">Email accounts only — Google/Facebook accounts sign in with those buttons.</p>

        {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
        {message && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{message}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@email.com" className="mt-1 w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <button type="submit" disabled={busy} className="w-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-5 text-center">
          Remembered it? <Link to="/login" className="text-action font-medium hover:text-[#1D4ED8]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
