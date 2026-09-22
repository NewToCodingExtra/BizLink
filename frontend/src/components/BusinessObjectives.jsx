const objectives = [
  { n: "01", title: "Bridge Verified Supply & Demand", desc: "Curate a verified directory of franchise and wholesale opportunities so entrepreneurs can compare capital, ROI and support on one trusted feed." },
  { n: "02", title: "Enable Direct, Transparent Matchmaking", desc: "Provide inquiry and consultation tools that let buyers and sellers negotiate directly — with clear ROI data, contracts and timelines." },
  { n: "03", title: "Accelerate Nationwide Entrepreneurship", desc: "Lower the barrier to business ownership through education, nationwide coverage and post-launch brand support that sustains growth." },
];

export default function BusinessObjectives() {
  return (
    <section className="py-12 md:py-20 bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-[11px] tracking-[0.2em] font-semibold text-text-secondary">BUSINESS OBJECTIVES</p>
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-primary mt-2">What we aim to achieve</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {objectives.map(o => (
            <div key={o.n} className="rounded-xl border border-border shadow-sm bg-surface p-6 hover:shadow-md transition-shadow duration-150">
              <span className="text-3xl font-bold tracking-tight text-accent">{o.n}</span>
              <h3 className="text-base font-semibold text-text-primary mt-3">{o.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-2">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
