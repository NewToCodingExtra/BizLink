import { useMemo } from 'react';

const features = [
  { 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, 
    title: "Verified Brands", 
    desc: "Every franchiser and wholesaler passes document and site validation. Look for the green Verified badge.", 
    accent: "text-success bg-success/10 border-success/20" 
  },
  { 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>, 
    title: "Direct Matchmaking", 
    desc: "Inquire on any card — opens a private consultation thread, not a generic form queue.", 
    accent: "text-action bg-action/10 border-action/20" 
  },
  { 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, 
    title: "Transparent ROI Data", 
    desc: "Capital, margins and payback periods are displayed upfront, comparable across opportunities.", 
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/20" 
  },
  { 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
    title: "Nationwide Reach", 
    desc: "From Metro Manila flagships to VisMin barangay routes — filter by region and launch anywhere.", 
    accent: "text-blue-400 bg-blue-400/10 border-blue-400/20" 
  },
];

export default function BusinessFeatures() {
  return (
    <section className="py-12 md:py-20 bg-bg relative overflow-hidden border-y border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <p className="text-center text-[11px] tracking-[0.2em] font-semibold text-accent">WHY CHOOSE US</p>
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-text-primary mt-2">Built for trust, scale and clarity</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-surface/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
              <span className={`w-12 h-12 rounded-full border grid place-items-center text-sm font-bold ${f.accent}`}>{f.icon}</span>
              <h3 className="text-base font-semibold text-text-primary mt-4">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}