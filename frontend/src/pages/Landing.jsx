import { Link } from "react-router-dom";
import BusinessOverview from "../components/BusinessOverview";
import BusinessFeatures from "../components/BusinessFeatures";
import BusinessObjectives from "../components/BusinessObjectives";
import MissionVision from "../components/MissionVision";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <BusinessOverview />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-primary rounded-2xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {user ? `Welcome back, ${user.name}` : "Join 12,000+ entrepreneurs finding verified deals"}
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {user
                ? "Your feed is live from the backend. Continue exploring franchises, wholesale hubs and resell drops."
                : "Create a free account to like, save, comment, inquire and message brands directly. Test data is now served from Laravel + MySQL."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {user ? (
              <Link to="/feed" className="px-5 py-2.5 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors">
                Go to Feed →
              </Link>
            ) : (
              <>
                <Link to="/register" className="px-5 py-2.5 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors">
                  Create account
                </Link>
                <Link to="/login" className="px-5 py-2.5 rounded-lg bg-surface/10 hover:bg-surface/15 border border-white/20 text-white text-sm font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/feed" className="px-5 py-2.5 rounded-lg bg-surface text-text-primary text-sm font-medium hover:bg-bg transition-colors">
                  Browse as guest
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-accent">DEMO LOGIN</p>
            <p className="font-semibold text-text-primary mt-1">Entrepreneur</p>
            <p className="text-text-secondary mt-1">demo@bizlink.ph · password123</p>
            <Link to="/login" className="text-action text-sm font-medium mt-2 inline-block">Log in →</Link>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-accent">DEMO LOGIN</p>
            <p className="font-semibold text-text-primary mt-1">Brand owner</p>
            <p className="text-text-secondary mt-1">brand@bizlink.ph · password123</p>
            <Link to="/login" className="text-action text-sm font-medium mt-2 inline-block">Log in →</Link>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-accent">GOOGLE</p>
            <p className="font-semibold text-text-primary mt-1">Continue with Google</p>
            <p className="text-text-secondary mt-1">Requires GOOGLE_CLIENT_ID in backend/.env</p>
            <Link to="/login" className="text-action text-sm font-medium mt-2 inline-block">Try Google →</Link>
          </div>
        </div>
      </div>

      <BusinessFeatures />
      <BusinessObjectives />
      <MissionVision />
    </div>
  );
}
