export default function MissionVision() {
  return (
    <section className="py-12 md:py-20 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-[11px] tracking-[0.2em] font-semibold text-text-secondary">MISSION & VISION</p>
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-text-primary mt-2 tracking-tight">What guides us</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 md:p-8">
            <span className="w-10 h-10 rounded-full bg-primary text-white grid place-items-center text-sm font-bold">M</span>
            <h3 className="text-lg font-semibold text-text-primary mt-4">Our Mission</h3>
            <p className="text-base text-text-secondary leading-relaxed mt-3">To empower aspiring entrepreneurs by providing a trusted platform that connects them with legitimate franchisers and wholesalers, ensuring transparent opportunities, verified brand information, and direct support for sustainable business growth.</p>
          </div>
          <div className="bg-surface rounded-xl border border-border shadow-sm p-6 md:p-8">
            <span className="w-10 h-10 rounded-full bg-accent text-[#0B1F3A] grid place-items-center text-sm font-bold">V</span>
            <h3 className="text-lg font-semibold text-text-primary mt-4">Our Vision</h3>
            <p className="text-base text-text-secondary leading-relaxed mt-3">To be the Philippines’ leading business matchmaking platform — recognized for integrity, nationwide reach, and for turning brand potential into thriving local enterprises in every community.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
