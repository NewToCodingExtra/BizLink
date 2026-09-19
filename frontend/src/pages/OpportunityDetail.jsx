import { useParams, Link } from "react-router-dom";
import CommentThread from "../components/CommentThread";

function badgeClasses(type) {
  if (type==="Franchise") return "bg-amber-50 text-amber-700 border-amber-100";
  if (type==="Wholesale") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

export default function OpportunityDetail({ opportunities, comments, savedIds, onToggleLike, onToggleSave, onAddComment, onInquire }) {
  const { id } = useParams();
  const opp = opportunities.find(o=>o.id===id);
  if (!opp) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-slate-500">Opportunity not found.</p><Link to="/" className="text-[#2563EB] text-sm font-medium">Back to feed</Link></div>;
  const saved = savedIds.includes(opp.id);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to feed</Link>
      <article className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <img src={opp.image} alt={opp.headline} className="w-full h-[360px] object-cover" />
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src={opp.brandAvatar} className="w-9 h-9 rounded-full" />
            <span className="text-sm font-semibold text-slate-900">{opp.brandName}</span>
            {opp.verified && <span className="text-xs font-bold text-[#16A34A] bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}
            <span className={`ml-auto text-xs font-medium border rounded-full px-2.5 py-1 ${badgeClasses(opp.type)}`}>{opp.type}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight mt-4">{opp.headline}</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{opp.description}</p>
          <div className="mt-4 flex gap-2">
            <span className="text-sm font-semibold bg-slate-900 text-white rounded-full px-3 py-1">{opp.capitalRequired}</span>
            <span className="text-sm font-medium bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-3 py-1">{opp.roi}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={()=>onToggleLike(opp.id)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${opp.liked ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-600"}`}>♥ {opp.likes} Interested</button>
            <button onClick={()=>onToggleSave(opp.id)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${saved ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white border-slate-200 text-slate-600"}`}>{saved?"★ Saved":"☆ Save"}</button>
            <button onClick={()=>onInquire(opp)} className="ml-auto px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium">Inquire</button>
          </div>
          <div className="mt-6">
            <CommentThread postId={opp.id} comments={comments} onAdd={onAddComment} />
          </div>
        </div>
      </article>
    </div>
  );
}
