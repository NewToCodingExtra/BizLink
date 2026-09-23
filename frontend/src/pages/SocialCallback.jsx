import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function explain(provider, error, detail) {
  const name = provider === "facebook" ? "Facebook" : "Google";
  switch (error) {
    case `${provider}_not_configured`:
      return `${name} OAuth is not configured on the backend. Set ${provider === "facebook" ? "FACEBOOK" : "GOOGLE"}_CLIENT_ID and _CLIENT_SECRET in backend/.env.`;
    case `${provider}_denied`:
      return `${name} login was denied. If the app is in testing mode, your account must be added as a tester (Google: OAuth consent screen → Audience; Facebook: App Roles → Testers).`;
    case `${provider}_failed`:
      return `${name} login failed during token exchange.${detail ? ` Server said: ${detail}` : " Check backend/storage/logs/laravel.log for the exact error."}`;
    default:
      return `${name} login failed (${error || "unknown error"}). Try again or use email login.`;
  }
}

export default function SocialCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");
  const [welcomeName, setWelcomeName] = useState(null);

  const provider = params.get("provider") || "google";

  useEffect(() => {
    const run = async () => {
      const token = params.get("token");
      const err = params.get("error");
      const detail = params.get("detail");
      if (err) {
        setError(explain(provider, err, detail));
        return;
      }
      if (!token) {
        setError("No token returned. Try again.");
        return;
      }
      try {
        const user = await loginWithToken(token);
        setWelcomeName(user?.name || 'User');
        setTimeout(() => {
          navigate("/feed", { replace: true });
        }, 2000);
      } catch {
        setError("Invalid session. Try again.");
      }
    };
    run();
  }, [params, provider, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
          <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>
          <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">Back to login</Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="inline-block w-8 h-8 border-2 border-[var(--color-action)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-[var(--color-text-primary)]">Finishing {provider === "facebook" ? "Facebook" : "Google"} sign-in...</p>
    </div>
  );
}
