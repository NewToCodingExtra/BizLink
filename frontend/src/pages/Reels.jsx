import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReelCard from "../components/ReelCard";
import CommentThread from "../components/CommentThread";
import ContactForm from "../components/ContactForm";
import { ReelsSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [commentOpp, setCommentOpp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    opportunitiesApi
      .list({ per_page: 30 })
      .then((res) => {
        if (cancelled) return;
        setReels((res.data || []).filter((o) => o.mediaType === "video"));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load reels");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  if (error && reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-slate-500">{error}</p></div>;
  if (reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-slate-500">No pitch reels yet — post a video opportunity.</p></div>;

  return (
    <div className="relative">
      {error && <p className="mx-auto max-w-md mt-3 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
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
        <div className="snap-start h-[100dvh] w-full bg-black grid place-items-center">
          <div className="text-center px-6 max-w-md">
            <span className="mx-auto w-12 h-12 rounded-full bg-white/10 grid place-items-center text-[#C9A24B] text-xl">✓</span>
            <p className="text-white font-semibold mt-4">You're all caught up</p>
            <p className="text-white/60 text-sm mt-1">You watched all {reels.length} pitch reel{reels.length !== 1 ? "s" : ""}. New pitches land here first.</p>
            <Link to="/feed" className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors">Back to feed</Link>
          </div>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
            <ContactForm
              prefill={selected}
              onClose={() => setSelected(null)}
              onSubmit={async ({ message }) => {
                await inboxApi.inquire({ opportunity_id: selected.id, message });
                setSelected(null);
              }}
            />
          </div>
        </div>
      )}
      {commentOpp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCommentOpp(null)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 truncate">Comments · {commentOpp.headline}</p>
              <button onClick={() => setCommentOpp(null)} aria-label="Close comments" className="w-8 h-8 grid place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0">×</button>
            </div>
            <CommentThread
              postId={commentOpp.id}
              comments={(reels.find((r) => String(r.id) === String(commentOpp.id))?.comments) || []}
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
      )}
    </div>
  );
}
