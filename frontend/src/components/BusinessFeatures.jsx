const features = [
  { icon: "✓", title: "Verified Brands", desc: "Every franchiser and wholesaler passes document and site validation. Look for the green Verified badge.", accent: "text-[#16A34A] bg-green-50 border-green-100" },
  { icon: "⟡", title: "Direct Matchmaking", desc: "Inquire on any card — opens a private consultation thread, not a generic form queue.", accent: "text-[#2563EB] bg-blue-50 border-blue-100" },
  { icon: "◈", title: "Transparent ROI Data", desc: "Capital, margins and payback periods are displayed upfront, comparable across opportunities.", accent: "text-amber-700 bg-amber-50 border-amber-100" },
  { icon: "◎", title: "Nationwide Reach", desc: "From Metro Manila flagships to VisMin barangay routes — filter by region and launch anywhere.", accent: "text-slate-700 bg-slate-50 border-slate-200" },
];

export default function BusinessFeatures() {
  return (
    <section className="py-12 md:py-20 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-[11px] tracking-[0.2em] font-semibold text-slate-400">WHY CHOOSE US</p>
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#0B1F3A] mt-2">Built for trust, scale and clarity</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-150">
              <span className={`w-10 h-10 rounded-full border grid place-items-center text-sm font-bold ${f.accent}`}>{f.icon}</span>
              <h3 className="text-base font-semibold text-slate-900 mt-4">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
