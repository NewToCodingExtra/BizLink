import { useState } from "react";
import { Link, router } from '@inertiajs/react';

export default function BusinessOverview() {
  const [q, setQ] = useState("");
  return (
    <section className="bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-text-primary bg-bg border border-border rounded-full px-3 py-1">BUSINESS DIRECTORY · PHILIPPINES</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-text-primary leading-[1.05]">Bridging Brands<br />and Business<br /><span className="text-accent">Owners</span></h1>
          <p className="mt-4 text-base text-text-secondary leading-relaxed max-w-xl">BizLink connects franchisers and wholesalers with aspiring buyers. Discover verified franchise directories, wholesale hubs and direct matching — all in one trusted feed.</p>
          <p className="mt-3 text-sm text-text-secondary">Dual-role explained: <span className="font-semibold text-text-primary">Brands publish opportunities</span> — <span className="font-semibold text-text-primary">Entrepreneurs discover, inquire and launch.</span></p>

          <form onSubmit={(e) => { e.preventDefault(); router.get('/search', { q }); }} className="mt-6 flex gap-2 max-w-md">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>
              </span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search coffee, beauty, logistics..." className="w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-3 py-3 text-sm bg-surface placeholder:text-text-secondary transition" />
            </div>
            <button type="submit" className="shrink-0 bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-medium px-5 rounded-lg transition-colors">Search</button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/search?q=Franchise" className="px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20 text-xs font-medium">Franchise</Link>
            <Link href="/search?q=Wholesale" className="px-3 py-1.5 rounded-full bg-bg text-text-primary border border-border text-xs font-medium">Wholesale</Link>
            <Link href="/search?q=Resell" className="px-3 py-1.5 rounded-full bg-action/10 text-action border border-action/20 text-xs font-medium">Resell</Link>
            <Link href="/" className="px-5 py-2 rounded-lg bg-text-primary text-bg text-sm font-medium hover:opacity-90 transition-colors ml-1">Explore Franchises →</Link>
          </div>

          <div className="mt-8 flex gap-6 text-center">
            <div><p className="text-xl font-bold text-text-primary">500+</p><p className="text-xs text-text-secondary">Verified Brands</p></div>
            <div className="w-px bg-bg" />
            <div><p className="text-xl font-bold text-text-primary">12k</p><p className="text-xs text-text-secondary">Entrepreneurs</p></div>
            <div className="w-px bg-bg" />
            <div><p className="text-xl font-bold text-text-primary">18 MO</p><p className="text-xs text-text-secondary">Avg. Payback</p></div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-bg">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80&auto=format&fit=crop" alt="BizLink overview" className="w-full h-[380px] md:h-[460px] object-cover" />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-surface border border-border rounded-xl shadow-md p-4 max-w-[260px] hidden md:block animate-float">
            <p className="text-xs font-semibold tracking-widest text-accent">FEATURED</p>
            <p className="text-sm font-semibold text-text-primary mt-1">BrewCraft Coffee — BGC Flagship</p>
            <p className="text-xs text-text-secondary mt-1">₱850K · 28% ROI · Franchise</p>
            <span className="inline-flex mt-2 text-xs font-medium bg-[#16A34A]/10 text-success px-2 py-1 rounded-full">● Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
