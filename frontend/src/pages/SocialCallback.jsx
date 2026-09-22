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
        await loginWithToken(token);
        navigate("/feed", { replace: true });
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
          <p className="text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-sm text-text-secondary">Finishing {provider === "facebook" ? "Facebook" : "Google"} sign-in...</p>
    </div>
  );
}
