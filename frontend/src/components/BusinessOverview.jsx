import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BusinessOverview() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-[#1E3A5F] bg-slate-50 border border-slate-200 rounded-full px-3 py-1">BUSINESS DIRECTORY · PHILIPPINES</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-[#0B1F3A] leading-[1.05]">Bridging Brands<br />and Business<br /><span className="text-[#C9A24B]">Owners</span></h1>
          <p className="mt-4 text-base text-slate-500 leading-relaxed max-w-xl">BuseLink connects franchisers and wholesalers with aspiring buyers. Discover verified franchise directories, wholesale hubs and direct matching — all in one trusted feed.</p>
          <p className="mt-3 text-sm text-slate-500">Dual-role explained: <span className="font-semibold text-slate-700">Brands publish opportunities</span> — <span className="font-semibold text-slate-700">Entrepreneurs discover, inquire and launch.</span></p>

          <form onSubmit={(e)=>{e.preventDefault(); navigate(`/search?q=${encodeURIComponent(q)}`);}} className="mt-6 flex gap-2 max-w-md">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>
              </span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search coffee, beauty, logistics..." className="w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-3 py-3 text-sm bg-white placeholder:text-slate-400 transition" />
            </div>
            <button type="submit" className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-medium px-5 rounded-lg transition-colors">Search</button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/search?q=Franchise" className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">Franchise</Link>
            <Link to="/search?q=Wholesale" className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">Wholesale</Link>
            <Link to="/search?q=Resell" className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">Resell</Link>
            <Link to="/" className="px-5 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#1E3A5F] transition-colors ml-1">Explore Franchises →</Link>
          </div>

          <div className="mt-8 flex gap-6 text-center">
            <div><p className="text-xl font-bold text-[#0B1F3A]">500+</p><p className="text-xs text-slate-400">Verified Brands</p></div>
            <div className="w-px bg-slate-200" />
            <div><p className="text-xl font-bold text-[#0B1F3A]">12k</p><p className="text-xs text-slate-400">Entrepreneurs</p></div>
            <div className="w-px bg-slate-200" />
            <div><p className="text-xl font-bold text-[#0B1F3A]">18 MO</p><p className="text-xs text-slate-400">Avg. Payback</p></div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80&auto=format&fit=crop" alt="BuseLink overview" className="w-full h-[380px] md:h-[460px] object-cover" />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white border border-slate-100 rounded-xl shadow-md p-4 max-w-[260px] hidden md:block">
            <p className="text-xs font-semibold tracking-widest text-[#C9A24B]">FEATURED</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">BrewCraft Coffee — BGC Flagship</p>
            <p className="text-xs text-slate-500 mt-1">₱850K · 28% ROI · Franchise</p>
            <span className="inline-flex mt-2 text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] px-2 py-1 rounded-full">● Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
