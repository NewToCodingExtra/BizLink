import { useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { can, hasRole } from "../utils/can";
import DropdownMenu from "./DropdownMenu";
import { HeartIcon, CommentIcon, BookmarkIcon, SparkleIcon } from "./icons";
import { profilePath } from "../utils/profilePath";
import { displayCapital, displayRoi } from "../utils/money";
import { useToast } from "../context/ToastContext";
import Modal from "./Modal";
import Button from "./Button";
import ReportModal from "./ReportModal";
import AuthorIdentity, { AuthorBadges } from "./AuthorIdentity";
import PostModal from "./PostModal";
import SmartMedia, { FeedVideo } from "./SmartMedia";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-warning/10 text-warning border border-warning/20";
  if (type === "Wholesale") return "bg-bg text-text-primary border border-border";
  return "bg-action/10 text-action border border-action/20";
}

function isFresh(createdAt) {
  if (!createdAt) return false;
  const t = typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 1000 * 60 * 60 * 24;
}

function formatDate(createdAt) {
  if (!createdAt) return "";
  const d = typeof createdAt === "number" ? new Date(createdAt) : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function OpportunityCard({ opp, comments, onToggleLike, onToggleSave, onAddComment, onInquire, saved }) {
  const toast = useToast();
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user ?? null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const fresh = isFresh(opp.createdAt);
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (comments || []).filter((c) => String(c.postId) === String(opp.id)).length;
  const ownerId = opp.user_id ?? opp.authorId ?? opp.user?.id;
  const isOwner = !!user && String(user.id) === String(ownerId);
  const canManage = !!user && (can(page, 'opportunities.update') && isOwner || hasRole(page, 'Admin'));

  return (
    <article className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden">
      <div className="p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
        <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="shrink-0 self-center">
          <img src={opp.brandAvatar} alt={opp.brandName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 aspect-square border border-border/40" />
        </Link>
        <div className="flex-1 min-w-0">
          <AuthorIdentity opp={opp} />
          <div className="mt-0.5 flex items-center gap-x-1.5 gap-y-1 flex-wrap">
            <AuthorBadges opp={opp} className="inline-flex sm:hidden" />
            <p className="text-xs text-text-secondary truncate min-w-0 max-w-full">{opp.category} · {formatDate(opp.createdAt)}</p>
            {fresh && <span className="text-[9px] font-bold tracking-wider bg-primary text-white px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap leading-none">NEW</span>}
            {opp.featured && <span className="text-[9px] font-bold tracking-wider bg-accent text-[#0B1F3A] px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap leading-none">FEATURED</span>}
            {opp.preferred && (
              <span title={(opp.reasons || []).join(" · ") || "Matches your preferences"} className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider bg-action/10 text-action border border-action/20 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap leading-none">
                <SparkleIcon className="w-2.5 h-2.5" /> FOR YOU
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] sm:text-xs font-medium border rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shrink-0 whitespace-nowrap ${badgeClasses(opp.type)}`}>
            {opp.type}
          </span>

          <div className="shrink-0">
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More actions"
              className="flex items-center justify-center w-11 h-11 rounded-full p-1 text-text-secondary hover:text-text-primary hover:bg-bg active:bg-bg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={menuBtnRef} align="right" width={192}>
            {canManage && (
              <>
                <Link
                  href={`/opportunities/${opp.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-text-primary hover:bg-bg gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 00-2.828-2.828L6.465 16.88A1 1 0 006.172 17.586V20z" /></svg>
                  Edit
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-error hover:bg-error/10 gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" /></svg>
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                if (window.onHideOpp) window.onHideOpp(opp.id);
              }}
              className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-text-primary hover:bg-bg gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
              Not Interested
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                if (!user) { toast.error("Log in to report."); return; }
                setReportOpen(true);
              }}
              className="w-full text-left px-4 py-2 min-h-[44px] flex items-center text-sm text-error hover:bg-error/10 gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Report
            </button>
          </DropdownMenu>
        </div>
        </div>
      </div>

      <Link href={`/post/${opp.slug}`} className="block bg-bg">
        {opp.mediaType === "video" && opp.videoUrl ? (
          <FeedVideo opp={opp} className="w-full h-[280px]" />
        ) : (
          <SmartMedia opp={opp} className="w-full h-[280px] object-cover" />
        )}
      </Link>

      <div className="p-4">
        <Link href={`/post/${opp.slug}`} className="text-lg font-semibold text-text-primary leading-tight hover:text-action line-clamp-2">{opp.headline}</Link>
        <p className="text-sm text-text-secondary mt-2 line-clamp-2 leading-relaxed">{opp.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold bg-primary-light text-white rounded-full px-3 py-1">{displayCapital(opp)}</span>
          <span className="text-xs font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1">{displayRoi(opp)}</span>
          <span className="text-xs text-text-secondary px-2 py-1">{opp.category}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onToggleLike(opp.id)}
              aria-label={opp.liked ? "Unlike" : "Like"}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-colors ${opp.liked ? "bg-error/10 border-error/20 text-error" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}
            >
              <HeartIcon filled={!!opp.liked} />
              <span>{opp.likes}</span>
            </button>
            <button
              type="button"
              onClick={() => setPostOpen(true)}
              aria-label="View comments"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-border bg-surface text-text-secondary hover:bg-bg text-xs sm:text-sm font-medium transition-colors"
            >
              <CommentIcon />
              {commentCount > 0 ? <span>{commentCount}</span> : null}
              <span className={commentCount > 0 ? "hidden sm:inline" : ""}>Comment</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(opp.id)}
              aria-label={saved ? "Unsave" : "Save"}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-colors ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}
            >
              <BookmarkIcon filled={!!saved} />
              <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onInquire(opp)}
            className="shrink-0 px-3.5 sm:px-4 py-1.5 rounded-lg bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 shadow-sm whitespace-nowrap"
          >
            Inquire
          </button>
        </div>
      </div>

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

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        endpoint={`/opportunities/${opp.id}/report`}
        title="Report this post"
      />

      <PostModal
        isOpen={postOpen}
        onClose={() => setPostOpen(false)}
        opp={opp}
        comments={comments}
        commentCount={commentCount}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onInquire={onInquire}
        onAddComment={onAddComment}
        saved={saved}
      />
    </article>
  );
}
