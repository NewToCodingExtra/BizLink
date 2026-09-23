import OpportunityCard from "./OpportunityCard";
import FilterBar from "./FilterBar";
import ProgressBar from "./ProgressBar";
import { OpportunityCardSkeleton } from "./Skeleton";

export default function OpportunityFeed({
  opportunities = [],
  comments = [],
  activeFilter = "All",
  onFilterChange,
  setActiveFilter,
  savedIds = [],
  onToggleLike,
  onToggleSave,
  onAddComment,
  onInquire,
  serverFiltered = true,
  loadingMore = false,
  refreshing = false,
  hasMore = false,
  sentinelRef = null,
  total = null,
  onLoadMore = null,
}) {
  const handleFilterChange = onFilterChange ?? setActiveFilter ?? (() => {});

  const filtered = serverFiltered
    ? (opportunities || [])
    : (opportunities || []).filter((o) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Following") return o.liked || savedIds.map(String).includes(String(o.id));
        return o.type === activeFilter;
      });

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="sticky top-[64px] z-20 bg-[var(--color-bg)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/80 py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border mb-4">
        <FilterBar active={activeFilter} onChange={handleFilterChange} />
      </div>
      {refreshing && <ProgressBar className="mb-4" ariaLabel="Refreshing feed" />}
      <div className="space-y-4">
        {total !== null && total > 0 && (hasMore || loadingMore) && (
          <p className="text-xs text-text-secondary">Showing {filtered.length} of {total} opportunit{total !== 1 ? "ies" : "y"}</p>
        )}
        {filtered.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.map(String).includes(String(opp.id))} />
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-text-secondary">
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
        {onLoadMore && hasMore && !loadingMore && filtered.length > 0 && (
          <div className="text-center py-2">
            <button onClick={onLoadMore} className="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-text-primary hover:bg-bg transition-colors">
              Load more
            </button>
          </div>
        )}
        {!hasMore && filtered.length > 0 && !loadingMore && (
          <p className="text-center text-xs text-text-secondary py-4">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}
