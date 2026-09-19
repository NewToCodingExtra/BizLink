import { useState } from "react";
import { Link } from "react-router-dom";
import CommentThread from "./CommentThread";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-amber-50 text-amber-700 border-amber-100";
  if (type === "Wholesale") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-blue-50 text-blue-700 border-blue-100"; // Resell
}

export default function OpportunityCard({ opp, comments, onToggleLike, onToggleSave, onAddComment, onInquire, saved }) {
  const [showComments, setShowComments] = useState(false);
  const isNew = Date.now() - opp.createdAt < 1000*60*60*24;

  return (
    <article className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden">
      {/* header */}
      <div className="p-4 flex items-center gap-3">
        <Link to={`/profile/${opp.brandId}`}><img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full object-cover" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${opp.brandId}`} className="text-sm font-semibold text-slate-900 hover:text-[#2563EB]">{opp.brandName}</Link>
            {opp.verified && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}
            {isNew && <span className="text-[10px] font-bold tracking-widest bg-[#0B1F3A] text-white px-2 py-0.5 rounded-full">NEW</span>}
            {opp.featured && <span className="text-[10px] font-bold tracking-widest bg-[#C9A24B] text-white px-2 py-0.5 rounded-full">FEATURED</span>}
          </div>
          <p className="text-xs text-slate-400">{opp.category} · {new Date(opp.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${badgeClasses(opp.type)}`}>{opp.type}</span>
      </div>

      {/* media */}
      <Link to={`/post/${opp.id}`} className="block bg-slate-50">
        {opp.mediaType === "video" && opp.videoUrl ? (
          <video src={opp.videoUrl} muted loop playsInline poster={opp.image} className="w-full h-[280px] object-cover" />
        ) : (
          <img src={opp.image} alt={opp.headline} className="w-full h-[280px] object-cover" loading="lazy" />
        )}
      </Link>

      {/* body */}
      <div className="p-4">
        <Link to={`/post/${opp.id}`} className="text-lg font-semibold text-slate-900 leading-tight hover:text-[#1E3A5F] line-clamp-2">{opp.headline}</Link>
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{opp.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold bg-slate-900 text-white rounded-full px-3 py-1">{opp.capitalRequired}</span>
          <span className="text-xs font-medium bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-3 py-1">{opp.roi}</span>
          <span className="text-xs text-slate-500 px-2 py-1">{opp.category}</span>
        </div>

        {/* action row */}
        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => onToggleLike(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${opp.liked ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            <span>{opp.liked ? "♥" : "♡"}</span> {opp.likes}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
            💬 Comment
          </button>
          <button onClick={() => onToggleSave(opp.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ml-auto ${saved ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {saved ? "★ Saved" : "☆ Save"}
          </button>
          <button onClick={() => onInquire(opp)} className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-300">Inquire</button>
        </div>

        {showComments && <CommentThread postId={opp.id} comments={comments} onAdd={onAddComment} />}
      </div>
    </article>
  );
}
