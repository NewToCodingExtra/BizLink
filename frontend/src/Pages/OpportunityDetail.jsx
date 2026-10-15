import { useEffect, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { can, hasRole } from "../utils/can";
import CommentThread from "../components/CommentThread";
import { HeartIcon, BookmarkIcon, CheckIcon, ArrowLeftIcon } from "../components/icons";
import { displayCapital, displayRoi } from "../utils/money";
import { httpApi } from "../utils/http";
import { goInquire } from "../utils/inquire";
import { useToast } from "../context/ToastContext";
import { profilePath } from "../utils/profilePath";
import Modal from "../components/Modal";
import Button from "../components/Button";
import ReportModal from "../components/ReportModal";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-warning/10 text-warning border border-warning/20";
  if (type === "Wholesale") return "bg-bg text-text-primary border-border";
  return "bg-action/10 text-action border border-action/20";
}

export default function OpportunityDetail({ opp: initialOpp }) {
  const toast = useToast();
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user ?? null;
  const [opp, setOpp] = useState(initialOpp ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setOpp(initialOpp ?? null);
  }, [initialOpp]);

  const ownerId = opp?.user_id ?? opp?.authorId ?? opp?.user?.id;
  const isOwner = !!user && !!opp && String(user.id) === String(ownerId);
  const canManage = !!user && !!opp && ((can(page, 'opportunities.update') && isOwner) || hasRole(page, 'Admin'));
  const saved = !!opp?.saved;
  const liked = !!opp?.liked;
  const likes = opp?.likes ?? 0;
  const comments = opp?.comments ?? [];

  const onToggleLike = async () => {
    if (!user || !opp) {
      if (!user) toast.error("Log in to like opportunities.");
      return;
    }
    setOpp((prev) => prev ? ({ ...prev, liked: !prev.liked, likes: prev.liked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1 }) : prev);
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/like`);
      setOpp((prev) => prev ? ({ ...prev, liked: res.liked ?? prev.liked, likes: res.likes_count ?? prev.likes }) : prev);
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
      setOpp((prev) => prev ? ({ ...prev, saved: res.saved, saves: res.saves_count ?? prev.saves }) : prev);
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  };

  // Append-only: CommentTree already POSTed; keep local list in sync.
  const onAddComment = async ({ comment }) => {
    if (!user || !opp || !comment) return;
    setOpp((prev) => prev ? ({ ...prev, comments: [...(prev.comments || []), comment] }) : prev);
  };

  if (!opp) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-text-secondary">Opportunity not found.</p>
        <Link href="/feed" className="text-action text-sm font-medium hover:underline mt-2 inline-block">Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={opp.headline} />
      <Link href="/feed" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeftIcon /> Back
      </Link>
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="shrink-0">
                <img src={opp.brandAvatar || "https://i.pravatar.cc/100?img=12"} alt={opp.brandName} className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-border/40" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="text-sm sm:text-base font-semibold text-text-primary hover:text-action truncate">
                    {opp.brandName}
                  </Link>
                  {opp.verified && (
                    <span title="Verified Brand" className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full px-1.5 sm:px-2 py-0.5 shrink-0 whitespace-nowrap">
                      <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Verified
                    </span>
                  )}
                </div>
                {opp.category && (
                  <p className="text-xs text-text-secondary truncate mt-0.5">{opp.category}</p>
                )}
              </div>
            </div>
            <span className={`text-xs font-medium border rounded-full px-3 py-1 shrink-0 whitespace-nowrap ${badgeClasses(opp.type)}`}>
              {opp.type}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight mt-4">{opp.headline}</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{opp.description}</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm font-semibold bg-primary-light text-white rounded-full px-3 py-1 whitespace-nowrap">{displayCapital(opp)}</span>
            <span className="text-sm font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1 whitespace-nowrap">{displayRoi(opp)}</span>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => (user ? goInquire(toast, "opportunity", opp.id) : toast.error("Log in to inquire."))}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Inquire
            </button>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <button
                type="button"
                onClick={onToggleLike}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors ${liked ? "bg-error/10 border border-error/20 text-error" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}
              >
                <HeartIcon filled={liked} />
                <span>{likes} <span className="hidden xs:inline">Interested</span></span>
              </button>

              <button
                type="button"
                onClick={onToggleSave}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}
              >
                <BookmarkIcon filled={saved} />
                <span>{saved ? "Saved" : "Save"}</span>
              </button>

              {canManage && (
                <>
                  <Link href={`/opportunities/${opp.id}/edit`} className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-bg transition-colors">
                    Edit
                  </Link>
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-error/30 text-sm font-medium text-error hover:bg-error/10 transition-colors">
                    Delete
                  </button>
                </>
              )}

              {!isOwner && !!user && (
                <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-border text-sm font-medium text-text-secondary hover:text-error hover:border-error/30 transition-colors sm:ml-auto">
                  Report
                </button>
              )}
            </div>
          </div>
          <div className="mt-6">
            <CommentThread postId={opp.id} postSlug={opp.slug} authorId={opp.authorId} comments={comments} onAdd={onAddComment} autoLoad />
          </div>
        </div>
      </article>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this opportunity?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                router.delete(`/opportunities/${opp.id}`, {
                  onFinish: () => setDeleting(false),
                  onError: () => toast.error("Could not delete this opportunity."),
                });
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">This removes the post from the feed. Comments and likes on it are deleted too.</p>
      </Modal>
      {opp && <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} endpoint={`/opportunities/${opp.id}/report`} title="Report this post" />}
    </div>
  );
}
