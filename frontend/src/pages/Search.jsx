import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import Modal from "../components/Modal";
import { FeedSkeleton, OpportunityCardSkeleton } from "../components/Skeleton";
import ProgressBar from "../components/ProgressBar";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { useAuth } from "../context/AuthContext";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const {
    items: results,
    setItems: setResults,
    loading,
    loadingMore,
    refreshing,
    error,
    setError,
    hasMore,
    total,
    sentinelRef,
  } = useInfiniteFeed({ perPage: 6, type: "All", q, enabled: q.trim().length > 0 });

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) setParams(input ? { q: input } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [input, q, setParams]);

  const comments = useMemo(() => results.flatMap((o) => o.comments || []), [results]);
  const savedIds = useMemo(() => results.filter((o) => o.saved).map((o) => o.id), [results]);

  const onToggleLike = async (id) => {
    if (!user) {
      setError("Log in to like opportunities.");
      return;
    }
    setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    if (!user) {
      setError("Log in to save opportunities.");
      return;
    }
    try {
      const res = await opportunitiesApi.toggleSave(id);
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, saved: res.saved } : o)));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    if (!user) return;
    const res = await opportunitiesApi.addComment(postId, text);
    setResults((prev) =>
      prev.map((o) => (String(o.id) === String(postId) ? { ...o, comments: [...(o.comments || []), res.data] } : o))
    );
  };

  const onInquire = (opp) => {
    if (!user) {
      setError("Log in to inquire.");
      return;
    }
    setSelectedPost(opp);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-primary">Search</h1>
      <div className="mt-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg>
        </span>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search brands, categories..." className="w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-4 py-3 text-sm bg-surface" />
      </div>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      {!q ? (
        <p className="text-sm text-text-secondary mt-6">Type to search franchises, wholesale and resell opportunities.</p>
      ) : loading && results.length === 0 ? (
        <div className="mt-6"><FeedSkeleton count={2} /></div>
      ) : results.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center mt-6">
          <p className="text-sm text-text-secondary">No opportunities match “{q}” — try a broader term.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {refreshing && <ProgressBar ariaLabel="Refreshing results" />}
          <p className="text-sm text-text-secondary">{(hasMore || loadingMore) ? `Showing ${results.length} of ${total} result${total !== 1 ? "s" : ""}` : `${total} result${total !== 1 ? "s" : ""}`} for “{q}”</p>
          {results.map((o) => (
            <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.map(String).includes(String(o.id))} />
          ))}
          {loadingMore && (
            <>
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
            </>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-2" />
          {!hasMore && !loadingMore && <p className="text-center text-xs text-text-secondary py-2">End of results.</p>}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="max-w-lg"
      >
        <ContactForm
          prefill={selectedPost}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async ({ message }) => {
            await inboxApi.inquire({ opportunity_id: selectedPost.id, message });
            setIsModalOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
