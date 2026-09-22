import { useEffect, useState } from "react";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import { FeedSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";

export default function Saved() {
  const [opps, setOpps] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    opportunitiesApi
      .saved()
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setOpps(data);
        setComments(data.flatMap((o) => o.comments || []));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load saved");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggleLike = async (id) => {
    setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    try {
      const res = await opportunitiesApi.toggleSave(id);
      if (!res.saved) {
        setOpps((prev) => prev.filter((o) => String(o.id) !== String(id)));
      }
    } catch (err) {
      setError(err.message || "Unsave failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    const res = await opportunitiesApi.addComment(postId, text);
    setComments((prev) => [...prev, res.data]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Saved Opportunities</h1>
      <p className="text-sm text-slate-500 mt-1">Bookmarked posts from MySQL — quick access to your shortlist.</p>
      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {loading ? (
        <div className="mt-6"><FeedSkeleton count={2} /></div>
      ) : (
        <div className="mt-6 space-y-4">
          {opps.length === 0 && <div className="bg-white rounded-xl border border-slate-100 p-8 text-center"><p className="text-sm text-slate-500">No saves yet. Tap ☆ Save on any card.</p></div>}
          {opps.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              comments={comments}
              onToggleLike={onToggleLike}
              onToggleSave={onToggleSave}
              onAddComment={onAddComment}
              onInquire={(p) => {
                setSelectedPost(p);
                setIsModalOpen(true);
              }}
              saved={true}
            />
          ))}
          {opps.length > 0 && (
            <p className="text-center text-xs text-slate-400 py-2">{opps.length} saved · End of your shortlist.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B1F3A]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
            <ContactForm
              prefill={selectedPost}
              onClose={() => setIsModalOpen(false)}
              onSubmit={async ({ message }) => {
                await inboxApi.inquire({ opportunity_id: selectedPost.id, message });
                setIsModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
