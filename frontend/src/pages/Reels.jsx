import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReelCard from "../components/ReelCard";
import CommentThread from "../components/CommentThread";
import ContactForm from "../components/ContactForm";
import { ReelsSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";

export default function Reels() {
  const { user } = useAuth();
  const {
    items: reels,
    setItems: setReels,
    loading,
    loadingMore,
    error,
    setError,
    hasMore,
    sentinelRef,
  } = useInfiniteFeed({ perPage: 10, mediaType: "video" });
  const [selected, setSelected] = useState(null);
  const [commentOpp, setCommentOpp] = useState(null);

  useEffect(() => {
    window.onHideOpp = async (id) => {
      try {
        await opportunitiesApi.hide(id);
        setReels(prev => prev.filter(o => String(o.id) !== String(id)));
      } catch (err) {
        setError("Failed to hide reel.");
      }
    };
    return () => {
      delete window.onHideOpp;
    };
  }, [setReels, setError]);

  const onToggleLike = async (id) => {
    if (!user) {
      setError("Log in to like reels.");
      return;
    }
    setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  if (loading) return <ReelsSkeleton count={2} />;
  if (error && reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-text-secondary">{error}</p></div>;
  if (reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-text-secondary">No pitch reels yet — post a video opportunity.</p></div>;

  return (
    <div className="relative">
      {error && <p className="mx-auto max-w-md mt-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="h-[calc(100dvh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black">
        {reels.map((r) => (
          <ReelCard
            key={r.id}
            opp={r}
            onToggleLike={onToggleLike}
            onInquire={(o) => (user ? setSelected(o) : setError("Log in to inquire."))}
            onOpenComments={(o) => (user ? setCommentOpp(o) : setError("Log in to comment."))}
          />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="snap-start h-[100dvh] w-full bg-black grid place-items-center">
            <div className="text-center px-6 max-w-md">
              <div className="w-8 h-8 border-4 border-slate-500 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-[var(--color-text-primary)] font-semibold mt-4">Loading more...</p>
            </div>
          </div>
        )}
        {!hasMore && reels.length > 0 && (
          <div className="snap-start h-[100dvh] w-full bg-black grid place-items-center">
            <div className="text-center px-6 max-w-md">
              <span className="mx-auto w-12 h-12 rounded-full bg-surface/10 grid place-items-center text-accent text-xl">✓</span>
              <p className="text-[var(--color-text-primary)] font-semibold mt-4">You're all caught up</p>
              <p className="text-[var(--color-text-primary)]/60 text-sm mt-1">You watched all {reels.length} pitch reel{reels.length !== 1 ? "s" : ""}. New pitches land here first.</p>
              <Link to="/feed" className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors">Back to feed</Link>
            </div>
          </div>
        )}
      </div>
      
      <Modal 
        isOpen={!!selected} 
        onClose={() => setSelected(null)} 
        maxWidth="max-w-lg"
      >
        <ContactForm 
          prefill={selected} 
          onClose={() => setSelected(null)} 
          onSubmit={async ({ message }) => {
            await inboxApi.inquire({ opportunity_id: selected.id, message });
            setSelected(null);
          }} 
          compact 
        />
      </Modal>

      <Modal 
        isOpen={!!commentOpp} 
        onClose={() => setCommentOpp(null)} 
        maxWidth="max-w-2xl"
      >
        <div className="bg-surface rounded-2xl w-full h-[80vh] flex flex-col">
          <div className="p-4 border-b border-border flex justify-between items-center bg-bg sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-text-primary">Comments · {commentOpp?.headline}</h3>
            <button onClick={() => setCommentOpp(null)} className="w-8 h-8 grid place-items-center rounded-full border border-border text-text-secondary hover:bg-surface">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <CommentThread 
              postId={commentOpp?.id} 
              comments={(reels.find((r) => String(r.id) === String(commentOpp?.id))?.comments) || []} 
              onAdd={async ({ text }) => {
                const res = await opportunitiesApi.addComment(commentOpp.id, text);
                setReels((prev) =>
                  prev.map((o) =>
                    String(o.id) === String(commentOpp.id)
                      ? { ...o, comments: [...(o.comments || []), res.data], commentsCount: (typeof o.commentsCount === "number" ? o.commentsCount : (o.comments || []).length) + 1 }
                      : o
                  )
                );
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
