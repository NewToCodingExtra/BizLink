import MissionVision from "../components/MissionVision";
import BusinessObjectives from "../components/BusinessObjectives";
import BusinessFeatures from "../components/BusinessFeatures";

export default function About() {
  return (
    <div>
      <section className="bg-[#0B1F3A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <p className="text-[11px] tracking-[0.2em] font-semibold text-[#C9A24B]">ABOUT BUSELINK</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Built to turn brand potential<br />into local enterprises</h1>
          <p className="text-slate-300 mt-3 max-w-2xl leading-relaxed">BuseLink is a curated franchise and wholesale directory with direct buyer–seller matchmaking. No inflated claims — just verified listings, transparent numbers and nationwide launch support.</p>
        </div>
      </section>
      <MissionVision />
      <BusinessObjectives />
      <BusinessFeatures />
    </div>
  );
}
