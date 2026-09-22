import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const token = params.get("token");
      const err = params.get("error");
      if (err) {
        setError(err === "google_not_configured" ? "Google OAuth is not configured on the backend. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." : "Google login failed. Try email login.");
        return;
      }
      if (!token) {
        setError("No token returned from Google. Try again.");
        return;
      }
      try {
        await loginWithToken(token);
        navigate("/feed", { replace: true });
      } catch {
        setError("Invalid Google session. Try again.");
      }
    };
    run();
  }, [params, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center">
          <p className="text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-sm text-slate-500">Finishing Google sign-in...</p>
    </div>
  );
}
