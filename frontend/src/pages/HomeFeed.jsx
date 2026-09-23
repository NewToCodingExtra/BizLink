import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StoriesBar from "../components/StoriesBar";
import OpportunityFeed from "../components/OpportunityFeed";
import ContactForm from "../components/ContactForm";
import Modal from "../components/Modal";
import CreateStoryModal from "../components/CreateStoryModal";
import { FeedSkeleton, StoriesBarSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi, preferencesApi, storiesApi } from "../api/client";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();
  const personalizedToastShown = useRef(false);

  const loadStories = async (signal) => {
    setStoriesLoading(true);
    try {
      const res = await storiesApi.list();
      if (signal?.aborted) return;
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
    } catch {
      if (!signal?.aborted) setStories([]);
    } finally {
      if (!signal?.aborted) setStoriesLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadStories(controller.signal);
    if (user) {
      preferencesApi
        .get()
        .then((res) => {
          if (!controller.signal.aborted) setPreferences({ categories: res.data.categories || [], budgetMin: res.data.budgetMin || "", budgetMax: res.data.budgetMax || "" });
        })
        .catch(() => {});
    }
    window.onOpenCreateStory = () => setIsCreateStoryOpen(true);
    return () => {
      controller.abort();
      delete window.onHideOpp;
      delete window.onOpenCreateStory;
    };
  }, [user]);

  useEffect(() => {
    const hasPrefs = user && (preferences.categories.length > 0 || preferences.budgetMin || preferences.budgetMax);
    if (hasPrefs && !personalizedToastShown.current) {
      personalizedToastShown.current = true;
      toast.info(
        <span>
          ✦ Personalized for you
          {preferences.categories.length > 0 ? ` · ${preferences.categories.join(", ")}` : ""}
          {(preferences.budgetMin || preferences.budgetMax) ? ` · ₱${preferences.budgetMin || "0"}–₱${preferences.budgetMax || "∞"}` : ""}
          {" · "}<Link to="/settings/preferences" className="text-action font-medium hover:underline">Edit preferences</Link>
        </span>
      );
    }
  }, [user, preferences, toast]);

  useEffect(() => {
    window.onHideOpp = async (id) => {
      try {
        await opportunitiesApi.hide(id);
        setOpportunities(prev => prev.filter(o => String(o.id) !== String(id)));
      } catch (err) {
        setError("Failed to hide opportunity.");
      }
    };
  }, [setOpportunities]);

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
          <div className="mb-4 bg-warning/10 border border-amber-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-warning flex-1 min-w-[200px]">Browsing as guest — feed is live from Laravel + MySQL. Log in to like, save, comment and inquire.</p>
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium">Log in</Link>
            <Link to="/" className="px-4 py-1.5 rounded-lg bg-surface border border-amber-200 text-warning text-sm font-medium">About BizLink</Link>
          </div>
        )}
        {error && <p className="mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
        {loading && opportunities.length === 0 ? (
          <>
            <StoriesBarSkeleton />
            <FeedSkeleton count={3} />
          </>
        ) : (
          <>
            {storiesLoading ? <StoriesBarSkeleton /> : <StoriesBar stories={stories} onOpenCreate={() => setIsCreateStoryOpen(true)} />}
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="max-w-lg"
      >
        <ContactForm prefill={selectedPost} onClose={() => setIsModalOpen(false)} onSubmit={handleInquirySubmit} compact />
      </Modal>

      <CreateStoryModal 
        isOpen={isCreateStoryOpen} 
        onClose={() => setIsCreateStoryOpen(false)} 
        onComplete={() => loadStories()}
      />
    </div>
  );
}
