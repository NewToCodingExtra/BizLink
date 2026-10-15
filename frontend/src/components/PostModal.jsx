import { Link } from "@inertiajs/react";
import Modal from "./Modal";
import CommentThread from "./CommentThread";
import SmartMedia, { FeedVideo } from "./SmartMedia";
import { HeartIcon, CommentIcon, BookmarkIcon } from "./icons";
import { displayCapital, displayRoi } from "../utils/money";
import AuthorIdentity, { AuthorBadges } from "./AuthorIdentity";

/**
 * Facebook-style post overlay: the post itself on top, the full comment
 * thread below in a scrollable sheet. Keeps feed cards compact while every
 * comment stays one tap away.
 */
export default function PostModal({
  isOpen,
  onClose,
  opp,
  comments = [],
  commentCount = 0,
  onToggleLike,
  onToggleSave,
  onInquire,
  onAddComment,
  saved = false,
}) {
  if (!isOpen || !opp) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" title={`${opp.brandName ?? "Post"}`}>
      <div className="-m-0">
        <div className="flex items-center gap-3">
          <img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
          <div className="min-w-0 flex-1">
            <AuthorIdentity opp={opp} />
            <div className="mt-0.5 flex items-center gap-x-1.5 gap-y-1 flex-wrap text-xs text-text-secondary">
              <AuthorBadges opp={opp} className="inline-flex sm:hidden" />
              <span className="truncate min-w-0">{opp.category} · {opp.type}</span>
            </div>
          </div>
          <Link href={`/post/${opp.slug || opp.id}`} className="text-xs font-medium text-action hover:underline shrink-0">
            Open page
          </Link>
        </div>

        <Link href={`/post/${opp.slug || opp.id}`} className="block mt-3 rounded-xl overflow-hidden bg-bg border border-border">
          {opp.mediaType === "video" && opp.videoUrl ? (
            <FeedVideo opp={opp} className="w-full max-h-[320px]" />
          ) : (
            <SmartMedia opp={opp} className="w-full max-h-[320px] object-cover" />
          )}
        </Link>

        <p className="text-base font-semibold text-text-primary leading-snug mt-3">{opp.headline}</p>
        {!!opp.description && <p className="text-sm text-text-secondary mt-1 leading-relaxed">{opp.description}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold bg-primary-light text-white rounded-full px-3 py-1">{displayCapital(opp)}</span>
          <span className="text-xs font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1">{displayRoi(opp)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => onToggleLike && onToggleLike(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${opp.liked ? "bg-error/10 border-error/20 text-error" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}>
            <HeartIcon filled={!!opp.liked} /> {opp.likes}
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-text-secondary text-sm font-medium">
            <CommentIcon /> {commentCount}
          </span>
          <button onClick={() => onToggleSave && onToggleSave(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}>
            <BookmarkIcon filled={!!saved} /> {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => onInquire && onInquire(opp)} className="ml-auto px-4 py-1.5 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors">
            Inquire
          </button>
        </div>

        <CommentThread
          postId={opp.id}
          postSlug={opp.slug}
          authorId={opp.authorId}
          comments={comments}
          onAdd={onAddComment}
          autoLoad
        />
      </div>
    </Modal>
  );
}
