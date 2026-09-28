import { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import OpportunityCard from "../Components/OpportunityCard";
import { BookmarkIcon } from "../Components/icons";
import { goInquire } from "../utils/inquire";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

export default function Saved({ opportunities: initialOpps = [] }) {
  const [opps, setOpps] = useState(initialOpps || []);
  const [comments, setComments] = useState(() => (initialOpps || []).flatMap((o) => o.comments || []));
  const toast = useToast();
  const { auth } = usePage().props;
  const viewer = auth?.user ?? null;

  const onToggleLike = async (id) => {
    setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${id}/like`);
      setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      toast.error(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    try {
      const res = await httpApi.post(`/opportunities/${id}/save`);
      if (!res.saved) {
        setOpps((prev) => prev.filter((o) => String(o.id) !== String(id)));
      }
    } catch (err) {
      toast.error(err.message || "Unsave failed");
    }
  };

  // Append-only: CommentTree already POSTed; keep local list in sync.
  const onAddComment = async ({ comment }) => {
    if (!comment) return;
    setComments((prev) => [...prev, comment]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title="Saved Opportunities" />
      <h1 className="text-2xl font-semibold text-text-primary">Saved Opportunities</h1>
      <p className="text-sm text-text-secondary mt-1">Bookmarked posts from MySQL — quick access to your shortlist.</p>
      <div className="mt-6 space-y-4">
        {opps.length === 0 && <div className="bg-surface rounded-xl border border-border p-8 text-center"><p className="inline-flex items-center gap-1.5 text-sm text-text-secondary">No saves yet. Tap <BookmarkIcon className="w-3.5 h-3.5" /> Save on any card.</p></div>}
        {opps.map((o) => (
          <OpportunityCard
            key={o.id}
            opp={o}
            comments={comments}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            onAddComment={onAddComment}
            onInquire={(p) => {
              if (!viewer) {
                toast.error("Log in to inquire.");
                return;
              }
              goInquire(toast, "opportunity", p.id);
            }}
            saved={true}
          />
        ))}
        {opps.length > 0 && (
          <p className="text-center text-xs text-text-secondary py-2">{opps.length} saved · End of your shortlist.</p>
        )}
      </div>
    </div>
  );
}
