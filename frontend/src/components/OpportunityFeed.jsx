import OpportunityCard from "./OpportunityCard";
import FilterBar from "./FilterBar";
import { OpportunityCardSkeleton } from "./Skeleton";

export default function OpportunityFeed({
  opportunities,
  comments,
  activeFilter,
  setActiveFilter,
  savedIds,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onInquire,
  serverFiltered = false,
  loadingMore = false,
  refreshing = false,
  hasMore = false,
  sentinelRef = null,
  total = null,
}) {
  const filtered = serverFiltered
    ? opportunities
    : opportunities.filter((o) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Following") return o.liked || savedIds.includes(o.id);
        return o.type === activeFilter;
      });

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="sticky top-[64px] z-20 bg-[#F8FAFC]/80 backdrop-blur supports-[backdrop-filter]:bg-[#F8FAFC]/80 py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-100 mb-4">
        <FilterBar active={activeFilter} onChange={setActiveFilter} />
      </div>
      {refreshing && (
        <div className="h-1 rounded-full bg-blue-100 overflow-hidden mb-4" role="status" aria-label="Refreshing feed">
          <div className="h-full w-1/2 rounded-full bg-[#2563EB] animate-pulse" />
        </div>
      )}
      <div className="space-y-4">
        {total !== null && total > 0 && (hasMore || loadingMore) && (
          <p className="text-xs text-slate-400">Showing {filtered.length} of {total} opportunit{total !== 1 ? "ies" : "y"}</p>
        )}
        {filtered.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.map(String).includes(String(opp.id))} />
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
            <p className="text-sm text-slate-500">
              {activeFilter === "Following" ? "Follow brands on their profile pages to build this feed." : "No opportunities in this filter."}
            </p>
          </div>
        )}
        {loadingMore && (
          <>
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </>
        )}
        {sentinelRef && <div ref={sentinelRef} aria-hidden="true" className="h-2" />}
        {!hasMore && filtered.length > 0 && !loadingMore && (
          <p className="text-center text-xs text-slate-400 py-4">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}
