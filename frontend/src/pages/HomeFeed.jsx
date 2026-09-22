import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StoriesBar from "../components/StoriesBar";
import OpportunityFeed from "../components/OpportunityFeed";
import ContactForm from "../components/ContactForm";
import { FeedSkeleton, StoriesBarSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi, preferencesApi, storiesApi } from "../api/client";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { useAuth } from "../context/AuthContext";

export default function HomeFeed() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const {
    items: opportunities,
    setItems: setOpportunities,
    loading,
    loadingMore,
    refreshing,
    error,
    setError,
    hasMore,
    total,
    sentinelRef,
  } = useInfiniteFeed({ perPage: 6, type: activeFilter });

  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [preferences, setPreferences] = useState({ categories: [], budgetMin: "", budgetMax: "" });
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStoriesLoading(true);
    storiesApi
      .list()
      .then((res) => {
        if (cancelled) return;
        setStories(
          (res.data || []).map((s) => ({
            id: s.id,
            brandId: s.brandId,
            brandName: s.brandName,
            avatar: s.avatar,
            mediaUrl: s.mediaUrl,
            caption: s.caption,
            expiresAt: s.expiresAt ? new Date(s.expiresAt).getTime() : Date.now() + 1000 * 60 * 60 * 20,
            seen: s.seen,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setStories([]);
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false);
      });
    if (user) {
      preferencesApi
        .get()
        .then((res) => {
          if (!cancelled) setPreferences({ categories: res.data.categories || [], budgetMin: res.data.budgetMin || "", budgetMax: res.data.budgetMax || "" });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [user]);

  const comments = useMemo(() => opportunities.flatMap((o) => o.comments || []), [opportunities]);
  const savedIds = useMemo(() => opportunities.filter((o) => o.saved).map((o) => o.id), [opportunities]);

  const onToggleLike = async (id) => {
    if (!user) {
      setError("Log in to like opportunities.");
      return;
    }
    setOpportunities((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setOpportunities((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch {
      setError("Like failed. Try again.");
    }
  };

  const onToggleSave = async (id) => {
    if (!user) {
      setError("Log in to save opportunities.");
      return;
    }
    try {
      const res = await opportunitiesApi.toggleSave(id);
      setOpportunities((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, saved: res.saved, saves: res.saves_count } : o)));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    if (!user) {
      setError("Log in to comment.");
      return;
    }
    try {
      const res = await opportunitiesApi.addComment(postId, text);
      setOpportunities((prev) =>
        prev.map((o) => (String(o.id) === String(postId) ? { ...o, comments: [...(o.comments || []), res.data] } : o))
      );
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  const onInquire = (opp) => {
    if (!user) {
      setError("Log in to inquire. Your message will open a private consultation thread.");
      return;
    }
    setSelectedPost(opp);
    setIsModalOpen(true);
  };

  const handleInquirySubmit = async ({ message }) => {
    if (!selectedPost || !user) return;
    try {
      await inboxApi.inquire({ opportunity_id: selectedPost.id, message });
      setIsModalOpen(false);
      setSelectedPost(null);
    } catch (err) {
      setError(err.message || "Inquiry failed");
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!user && (
          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-amber-800 flex-1 min-w-[200px]">Browsing as guest — feed is live from Laravel + MySQL. Log in to like, save, comment and inquire.</p>
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium">Log in</Link>
            <Link to="/" className="px-4 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-800 text-sm font-medium">About BizLink</Link>
          </div>
        )}
        {error && <p className="mb-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {loading && opportunities.length === 0 ? (
          <>
            <StoriesBarSkeleton />
            <FeedSkeleton count={3} />
          </>
        ) : (
          <>
            {storiesLoading ? <StoriesBarSkeleton /> : <StoriesBar stories={stories} />}
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
              serverFiltered
              loadingMore={loadingMore}
              refreshing={refreshing}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              total={total}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B1F3A]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
            <ContactForm prefill={selectedPost} onClose={() => setIsModalOpen(false)} onSubmit={handleInquirySubmit} />
          </div>
        </div>
      )}
    </div>
  );
}
