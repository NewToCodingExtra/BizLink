import BusinessOverview from "../components/BusinessOverview";
import StoriesBar from "../components/StoriesBar";
import OpportunityFeed from "../components/OpportunityFeed";

export default function HomeFeed({ opportunities, comments, stories, activeFilter, setActiveFilter, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  // auto-filter/sort bonus: score by preferences (simple)
  return (
    <div>
      <BusinessOverview />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <StoriesBar stories={stories} />
        <OpportunityFeed
          opportunities={opportunities}
          comments={comments}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          savedIds={savedIds}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onAddComment={onAddComment}
          onInquire={onInquire}
        />
      </div>
    </div>
  );
}
