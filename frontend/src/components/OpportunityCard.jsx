import { useState } from "react";
import { Link } from "react-router-dom";
import CommentThread from "./CommentThread";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-amber-50 text-amber-700 border-amber-100";
  if (type === "Wholesale") return "bg-bg text-text-primary border-border";
  return "bg-blue-50 text-blue-700 border-blue-100";
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
  const [showComments, setShowComments] = useState(false);
  const fresh = isFresh(opp.createdAt);
  const commentCount = typeof opp.commentsCount === "number" ? opp.commentsCount : (comments || []).filter((c) => String(c.postId) === String(opp.id)).length;

  return (
    <article className="bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Link to={`/profile/${opp.brandId}`}><img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full object-cover" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${opp.brandId}`} className="text-sm font-semibold text-text-primary hover:text-action">{opp.brandName}</Link>
            {opp.verified && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}
            {fresh && <span className="text-[10px] font-bold tracking-widest bg-primary text-white px-2 py-0.5 rounded-full">NEW</span>}
            {opp.featured && <span className="text-[10px] font-bold tracking-widest bg-accent text-white px-2 py-0.5 rounded-full">FEATURED</span>}
          </div>
          <p className="text-xs text-text-secondary">{opp.category} · {formatDate(opp.createdAt)}</p>
        </div>
        <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${badgeClasses(opp.type)}`}>{opp.type}</span>
        
        <div className="relative ml-2">
          <button 
            onClick={() => {
              const el = document.getElementById(`menu-${opp.id}`);
              el.classList.toggle('hidden');
            }}
            className="p-1.5 text-text-secondary hover:text-text-secondary rounded-full hover:bg-bg transition-colors"
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
                alert("Reported.");
              }} 
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Report
            </button>
          </div>
        </div>
      </div>

      <Link to={`/post/${opp.id}`} className="block bg-bg">
        {opp.mediaType === "video" && opp.videoUrl ? (
          <video src={opp.videoUrl} muted loop playsInline poster={opp.image} className="w-full h-[280px] object-cover" />
        ) : (
          <img src={opp.image} alt={opp.headline} className="w-full h-[280px] object-cover" loading="lazy" />
        )}
      </Link>

      <div className="p-4">
        <Link to={`/post/${opp.id}`} className="text-lg font-semibold text-text-primary leading-tight hover:text-primary-light line-clamp-2">{opp.headline}</Link>
        <p className="text-sm text-text-secondary mt-2 line-clamp-2 leading-relaxed">{opp.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold bg-slate-900 text-white rounded-full px-3 py-1">{opp.capitalRequired}</span>
          <span className="text-xs font-medium bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-3 py-1">{opp.roi}</span>
          <span className="text-xs text-text-secondary px-2 py-1">{opp.category}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => onToggleLike(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${opp.liked ? "bg-red-50 border-red-200 text-red-600" : "bg-surface border-border text-text-secondary hover:bg-bg"}`}>
            <span>{opp.liked ? "♥" : "♡"}</span> {opp.likes}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-text-secondary hover:bg-bg text-sm font-medium transition-colors">
            💬 {commentCount > 0 ? commentCount : "Comment"}
          </button>
          <button onClick={() => onToggleSave(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ml-auto ${saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface text-text-secondary border-border hover:bg-bg"}`}>
            {saved ? "★ Saved" : "☆ Save"}
          </button>
          <button onClick={() => onInquire(opp)} className="px-4 py-1.5 rounded-lg bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-300">Inquire</button>
        </div>

        {showComments && <CommentThread postId={opp.id} comments={comments} onAdd={onAddComment} />}
      </div>
    </article>
  );
}
