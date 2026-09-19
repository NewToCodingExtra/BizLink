import OpportunityCard from "../components/OpportunityCard";

export default function Saved({ opportunities, comments, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  const savedOpps = opportunities.filter(o => savedIds.includes(o.id));
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Saved Opportunities</h1>
      <p className="text-sm text-slate-500 mt-1">Bookmarked posts — quick access to your shortlist.</p>
      <div className="mt-6 space-y-4">
        {savedOpps.length===0 && <div className="bg-white rounded-xl border border-slate-100 p-8 text-center"><p className="text-sm text-slate-500">No saves yet. Tap ☆ Save on any card.</p></div>}
        {savedOpps.map(o => (
          <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={true} />
        ))}
      </div>
    </div>
  );
}
