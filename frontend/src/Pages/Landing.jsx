import { Head, Link, usePage } from "@inertiajs/react";
import BusinessOverview from "../Components/BusinessOverview";
import BusinessFeatures from "../Components/BusinessFeatures";
import BusinessObjectives from "../Components/BusinessObjectives";
import MissionVision from "../Components/MissionVision";
import { ArrowRightIcon } from "../Components/icons";

export default function Landing() {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;

  return (
    <div>
      <Head title="Bridging Brands and Business Owners" />
      <BusinessOverview />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-primary rounded-2xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
          {/* Gold Honeycomb Thread Background */}
          <div
            className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-30"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)",
              maskImage: "linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)"
            }}
          >
            <svg width="100%" height="100%">
              <defs>
                <pattern id="honeycomb" width="34.641" height="60" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                  <path d="M 17.3205 0 L 34.641 10 L 34.641 30 L 17.3205 40 L 0 30 L 0 10 Z" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
                  <path d="M 17.3205 40 L 17.3205 60" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#honeycomb)" />
            </svg>
          </div>
          <div className="flex-1 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {user ? `Welcome back, ${user.name}` : "Join 12,000+ entrepreneurs finding verified deals"}
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {user
                ? "Your feed is live from the backend. Continue exploring franchises, wholesale hubs and resell drops."
                : "Create a free account to like, save, comment, inquire and message brands directly. Test data is now served from Laravel + MySQL."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0 relative z-10">
            {user ? (
              <Link href="/feed" className="px-5 py-2.5 rounded-lg bg-accent text-[#0B1F3A] font-bold text-sm transition-colors hover:brightness-110 shadow-lg shadow-accent/20">
                Go to Feed &rarr;</Link>
            ) : (
              <>
                <Link href="/register" className="px-5 py-2.5 rounded-lg bg-accent text-[#0B1F3A] font-bold text-sm transition-colors hover:brightness-110 shadow-lg shadow-accent/20">
                  Create account
                </Link>
                <Link href="/login" className="px-5 py-2.5 rounded-lg border border-accent/50 text-accent text-sm font-medium hover:bg-accent/10 transition-colors">
                  Log in
                </Link>
                <Link href="/feed" className="px-5 py-2.5 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 hover:border-white/40 transition-all">
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
            <Link href="/login" className="text-action text-sm font-medium mt-2 inline-flex items-center gap-1">Log in <ArrowRightIcon className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-accent">DEMO LOGIN</p>
            <p className="font-semibold text-text-primary mt-1">Brand owner</p>
            <p className="text-text-secondary mt-1">brand@bizlink.ph · password123</p>
            <Link href="/login" className="text-action text-sm font-medium mt-2 inline-flex items-center gap-1">Log in <ArrowRightIcon className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-accent">GOOGLE</p>
            <p className="font-semibold text-text-primary mt-1">Continue with Google</p>
            <p className="text-text-secondary mt-1">Requires GOOGLE_CLIENT_ID in backend/.env</p>
            <Link href="/login" className="text-action text-sm font-medium mt-2 inline-flex items-center gap-1">Try Google <ArrowRightIcon className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </div>

      <BusinessFeatures />
      <BusinessObjectives />
      <MissionVision />
    </div>
  );
}

