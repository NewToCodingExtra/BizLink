import OpportunityCard from "./OpportunityCard";
import FilterBar from "./FilterBar";

export default function OpportunityFeed({ opportunities, comments, activeFilter, setActiveFilter, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  const filtered = opportunities.filter(o => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Following") return o.liked || savedIds.includes(o.id);
    return o.type === activeFilter;
  });

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="sticky top-[64px] z-20 bg-[#F8FAFC]/80 backdrop-blur supports-[backdrop-filter]:bg-[#F8FAFC]/80 py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-100 mb-4">
        <FilterBar active={activeFilter} onChange={setActiveFilter} />
      </div>
      <div className="space-y-4">
        {filtered.map(opp => (
          <OpportunityCard key={opp.id} opp={opp} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.includes(opp.id)} />
        ))}
        {filtered.length===0 && <div className="bg-white rounded-xl border border-slate-100 p-8 text-center"><p className="text-sm text-slate-500">No opportunities in this filter.</p></div>}
      </div>
    </div>
  );
}
