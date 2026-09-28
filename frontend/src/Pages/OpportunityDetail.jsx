import { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CommentThread from "../Components/CommentThread";
import { HeartIcon, BookmarkIcon, CheckIcon, ArrowLeftIcon } from "../Components/icons";
import { displayCapital, displayRoi } from "../utils/money";
import { httpApi } from "../utils/http";
import { goInquire } from "../utils/inquire";
import { useToast } from "../context/ToastContext";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-warning/10 text-warning border border-warning/20";
  if (type === "Wholesale") return "bg-bg text-text-primary border-border";
  return "bg-action/10 text-action border border-action/20";
}

export default function OpportunityDetail({ opp: initialOpp }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const [opp, setOpp] = useState(initialOpp ?? null);

  useEffect(() => {
    setOpp(initialOpp ?? null);
  }, [initialOpp]);

  const comments = opp?.comments ?? [];

  const onToggleLike = async () => {
    if (!user || !opp) {
      if (!user) toast.error("Log in to like opportunities.");
      return;
    }
    setOpp({ ...opp, liked: !opp.liked, likes: opp.liked ? opp.likes - 1 : opp.likes + 1 });
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/like`);
      setOpp((prev) => ({ ...prev, liked: res.liked ?? prev.liked, likes: res.likes_count ?? prev.likes }));
    } catch (err) {
      toast.error(err.message || "Like failed");
    }
  };

  const onToggleSave = async () => {
    if (!user || !opp) {
      if (!user) toast.error("Log in to save opportunities.");
      return;
    }
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/save`);
      setOpp((prev) => ({ ...prev, saved: res.saved, saves: res.saves_count ?? prev.saves }));
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  };

  // Append-only: CommentTree already POSTed; keep local list in sync.
  const onAddComment = async ({ comment }) => {
    if (!user || !opp || !comment) return;
    setOpp((prev) => ({ ...prev, comments: [...(prev.comments || []), comment] }));
  };

  if (!opp) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-text-secondary">Opportunity not found.</p><Link href="/feed" className="text-action text-sm font-medium">Back to feed</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={opp.headline} />
      <Link href="/feed" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"><ArrowLeftIcon /> Back</Link>
      <article className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {opp.mediaType === "video" && opp.videoUrl ? (
          <video
            src={opp.videoUrl}
            poster={opp.image || undefined}
            controls
            playsInline
            loop
            className="w-full h-56 sm:h-72 lg:h-[360px] object-contain bg-black"
          />
        ) : (
          <img src={opp.image} alt={opp.headline} className="w-full h-56 sm:h-72 lg:h-[360px] object-cover" />
        )}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap">
            <img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full shrink-0" />
            <span className="text-sm font-semibold text-text-primary truncate min-w-0 max-w-full">{opp.brandName}</span>
            {opp.verified && <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-1 leading-none shrink-0 whitespace-nowrap"><CheckIcon className="w-3 h-3" /> Verified</span>}
            <span className={`sm:ml-auto text-xs font-medium border rounded-full px-2.5 py-1 leading-none shrink-0 whitespace-nowrap ${badgeClasses(opp.type)}`}>{opp.type}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight mt-4">{opp.headline}</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{opp.description}</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm font-semibold bg-primary-light text-white rounded-full px-3 py-1 whitespace-nowrap">{displayCapital(opp)}</span>
            <span className="text-sm font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1 whitespace-nowrap">{displayRoi(opp)}</span>
          </div>
          <div className="mt-6 flex gap-2 flex-wrap">
            <button onClick={onToggleLike} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap ${opp.liked ? "bg-error/10 border border-error/20 text-error" : "bg-surface border-border text-text-secondary"}`}><HeartIcon filled={!!opp.liked} /> {opp.likes} Interested</button>
            <button onClick={onToggleSave} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap ${opp.saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface border-border text-text-secondary"}`}><BookmarkIcon filled={!!opp.saved} /> {opp.saved ? "Saved" : "Save"}</button>
            <button onClick={() => (user ? goInquire(toast, "opportunity", opp.id) : toast.error("Log in to inquire."))} className="flex-1 min-w-[120px] inline-flex justify-center px-5 py-2 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium">Inquire</button>
          </div>
          <div className="mt-6">
            <CommentThread postId={opp.id} postSlug={opp.slug} authorId={opp.authorId} comments={comments} onAdd={onAddComment} autoLoad />
          </div>
        </div>
      </article>

    </div>
  );
}
