import { useState } from "react";
import { Link } from "@inertiajs/react";
import CommentThread from "./CommentThread";
import { HeartIcon, CommentIcon, BookmarkIcon, CheckIcon, SparkleIcon } from "./icons";
import { profilePath } from "../utils/profilePath";
import { displayCapital, displayRoi } from "../utils/money";
import { useToast } from "../context/ToastContext";

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
  const [showComments, setShowComments] = useState(false);
  const fresh = isFresh(opp.createdAt);
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (comments || []).filter((c) => String(c.postId) === String(opp.id)).length;

  return (
    <article className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden">
      <div className="p-4 flex items-center gap-2 sm:gap-3">
        <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="shrink-0"><img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full object-cover" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
            <Link href={profilePath({ username: opp.user?.username || opp.authorUsername, authorId: opp.authorId, brandId: opp.brandId })} className="text-sm font-semibold text-text-primary hover:text-action truncate min-w-0 max-w-full">{opp.brandName}</Link>
            {opp.verified && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap"><CheckIcon className="w-3 h-3" /> Verified</span>}
            {fresh && <span className="text-[10px] font-bold tracking-widest bg-primary text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">NEW</span>}
            {opp.featured && <span className="text-[10px] font-bold tracking-widest bg-accent text-[#0B1F3A] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">FEATURED</span>}
            {opp.preferred && <span title={(opp.reasons || []).join(" · ") || "Matches your preferences"} className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest bg-action/10 text-action border border-action/20 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"><SparkleIcon className="w-3 h-3" /> FOR YOU</span>}
          </div>
          <p className="text-xs text-text-secondary truncate">{opp.category} · {formatDate(opp.createdAt)}</p>
        </div>
        <span className={`text-xs font-medium border rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap ${badgeClasses(opp.type)}`}>{opp.type}</span>

        <div className="relative shrink-0">
          <button
            onClick={() => {
              const el = document.getElementById(`menu-${opp.id}`);
              el.classList.toggle('hidden');
            }}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
          <div id={`menu-${opp.id}`} className="hidden absolute right-0 mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border z-10 py-1">
            <button
              onClick={() => {
                document.getElementById(`menu-${opp.id}`).classList.add('hidden');
                if (window.onHideOpp) window.onHideOpp(opp.id);
              }}
              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
              Not Interested
            </button>
            <button
              onClick={() => {
                document.getElementById(`menu-${opp.id}`).classList.add('hidden');
                toast.success("Reported successfully.");
              }}
              className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Report
            </button>
          </div>
        </div>
      </div>

      <Link href={`/post/${opp.slug}`} className="block bg-bg">
        {opp.mediaType === "video" && opp.videoUrl ? (
          <video src={opp.videoUrl} muted loop playsInline poster={opp.image} className="w-full h-[280px] object-cover" />
        ) : (
          <img src={opp.image} alt={opp.headline} className="w-full h-[280px] object-cover" loading="lazy" />
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

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => onToggleLike(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${opp.liked ? "bg-error/10 border border-error/20 text-error" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}>
            <HeartIcon filled={!!opp.liked} /> {opp.likes}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-text-secondary hover:bg-bg text-sm font-medium transition-colors">
            <CommentIcon /> {commentCount > 0 ? commentCount : "Comment"}
          </button>
          <button onClick={() => onToggleSave(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ml-auto ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}>
            <BookmarkIcon filled={!!saved} /> {saved ? "Saved" : "Save"}
          </button>
          <button onClick={() => onInquire(opp)} className="px-4 py-1.5 rounded-lg bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-300">Inquire</button>
        </div>

        {showComments && <CommentThread postId={opp.id} postSlug={opp.slug} authorId={opp.authorId} comments={comments} onAdd={onAddComment} autoLoad={showComments} />}
      </div>
    </article>
  );
}
