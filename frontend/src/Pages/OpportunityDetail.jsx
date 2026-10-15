import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { can, hasRole } from "../utils/can";
import CommentThread from "../components/CommentThread";
import { HeartIcon, BookmarkIcon, ArrowLeftIcon, DotsIcon, PencilIcon, TrashIcon, FlagIcon, LinkIcon, CommentIcon } from "../components/icons";
import { displayCapital, displayRoi } from "../utils/money";
import { httpApi } from "../utils/http";
import { goInquire } from "../utils/inquire";
import { useToast } from "../context/ToastContext";
import { profilePath } from "../utils/profilePath";
import Modal from "../components/Modal";
import Button from "../components/Button";
import DropdownMenu from "../components/DropdownMenu";
import ReportModal from "../components/ReportModal";
import AuthorIdentity, { AuthorBadges } from "../components/AuthorIdentity";
import SmartMedia from "../components/SmartMedia";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${opp.slug}`);
      toast.success("Link copied.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const commentTotal = typeof opp?.commentsCount === "number" ? opp.commentsCount : (comments || []).length;

  if (!opp) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-text-secondary">Opportunity not found.</p>
        <Link href="/feed" className="text-action text-sm font-medium hover:underline mt-2 inline-block">Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <Head title={opp.headline} />
      {/* Top bar: back + overflow menu share one row */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="inline-flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface active:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <button
            ref={menuBtnRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Post options"
            className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface active:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <DotsIcon className="w-5 h-5" />
          </button>
          <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={menuBtnRef} align="right" width={208}>
            {canManage && (
              <>
                <Link
                  href={`/opportunities/${opp.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-4 py-2 min-h-[44px] flex items-center gap-2.5 text-sm text-text-primary hover:bg-bg"
                >
                  <PencilIcon className="w-4 h-4" /> Edit post
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="w-full text-left px-4 py-2 min-h-[44px] flex items-center gap-2.5 text-sm text-error hover:bg-error/10"
                >
                  <TrashIcon className="w-4 h-4" /> Delete post
                </button>
              </>
            )}
            <button
              onClick={() => { setMenuOpen(false); copyLink(); }}
              className="w-full text-left px-4 py-2 min-h-[44px] flex items-center gap-2.5 text-sm text-text-primary hover:bg-bg"
            >
              <LinkIcon className="w-4 h-4" /> Copy link
            </button>
            {!isOwner && !!user && (
              <button
                onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                className="w-full text-left px-4 py-2 min-h-[44px] flex items-center gap-2.5 text-sm text-error hover:bg-error/10"
              >
                <FlagIcon className="w-4 h-4" /> Report post
              </button>
            )}
          </DropdownMenu>
        </div>
      </div>

      <article className="mt-2 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <SmartMedia
          opp={opp}
          className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover bg-bg"
          videoProps={{ controls: true, loop: false, preload: "metadata" }}
        />
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="shrink-0">
                <img src={opp.brandAvatar || "https://i.pravatar.cc/100?img=12"} alt={opp.brandName} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover aspect-square border border-border/40" />
              </Link>
              <div className="min-w-0 flex-1">
                <AuthorIdentity opp={opp} nameClassName="text-sm sm:text-base font-semibold" />
                {opp.category && (
                  <div className="mt-0.5 flex items-center gap-x-1.5 gap-y-1 flex-wrap text-xs text-text-secondary">
                    <AuthorBadges opp={opp} className="inline-flex sm:hidden" />
                    <span className="truncate min-w-0">{opp.category}</span>
                  </div>
                )}
              </div>
            </div>
            <span className={`text-xs font-medium border rounded-full px-3 py-1 shrink-0 whitespace-nowrap ${badgeClasses(opp.type)}`}>
              {opp.type}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight mt-4 text-balance">{opp.headline}</h1>
          {!!opp.description && <p className="text-sm text-text-secondary mt-2 leading-relaxed">{opp.description}</p>}
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm font-semibold bg-primary-light text-white rounded-full px-3 py-1 whitespace-nowrap">{displayCapital(opp)}</span>
            <span className="text-sm font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1 whitespace-nowrap">{displayRoi(opp)}</span>
          </div>

          {/* Primary CTA + icon action row */}
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => (user ? goInquire(toast, "opportunity", opp.id) : toast.error("Log in to inquire."))}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <CommentIcon className="w-4 h-4" /> Inquire about this opportunity
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={liked}
                aria-label={liked ? "Unlike" : "Like"}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${liked ? "bg-error/10 border-error/20 text-error" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}
              >
                <HeartIcon filled={liked} /> <span className="tabular-nums">{likes}</span>
              </button>
              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                aria-label={saved ? "Unsave" : "Save"}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}
              >
                <BookmarkIcon filled={saved} /> <span>{saved ? "Saved" : "Save"}</span>
              </button>
              <a
                href="#post-comments"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-surface text-text-secondary hover:bg-bg text-sm font-medium transition-colors"
              >
                <CommentIcon /> <span className="tabular-nums">{commentTotal}</span>
              </a>
            </div>
          </div>
          <div id="post-comments" className="mt-6 scroll-mt-20">
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
